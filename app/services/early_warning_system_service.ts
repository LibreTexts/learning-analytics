import axios, { AxiosInstance } from "axios";
import * as jose from "jose";
import assignmentScores from "#mongodb/assignmentScores";
import assignments from "#mongodb/assignments";
import calcADAPTInteractionDays from "#mongodb/calcADAPTInteractionDays";
import calcADAPTScores from "#mongodb/calcADAPTScores";
import calcADAPTStudentActivity from "#mongodb/calcADAPTStudentActivity";
import calcReviewTime from "#mongodb/calcReviewTime";
import calcTimeOnTask from "#mongodb/calcTimeOnTask";
import enrollments from "#mongodb/enrollments";
import ewsActorSummary, {
  IEWSActorSummary_Raw,
} from "#mongodb/ewsActorSummary";
import ewsCourseSummary, {
  IEWSCourseSummary_Raw,
} from "#mongodb/ewsCourseSummary";
import { EWSResult, EarlyWarningStatus } from "#types/ews";
import logger from "@adonisjs/core/services/logger";
import { PARSE_TIME_ON_TASK_PIPELINE } from "../mongodb/helpers.js";
import { decryptStudent } from "#utils/crypto";

export class EarlyWarningSystemService {
  constructor() { }

  private readonly EWS_THRESHOLDS = {
    DANGER: 69,
    WARNING: 79,
  };

  private readonly EWS_Z_SCORE_THRESHOLDS = {
    DANGER: -1.5,
    WARNING: -1.0,
  };

  private log(msg: string) {
    logger.info(`[EWS Service] ${msg}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const axiosInstance = await this.getAxios();
      const response = await axiosInstance.get("/");
      if (!response.data?.status) return false;
      return response.data.status === "ok";
    } catch (err) {
      console.error("EWS Health Check Error:", err);
      return false;
    }
  }

  public async updateEWSData(): Promise<boolean> {
    try {
      await this.writeEWSCourseSummary();
      await this.writeEWSActorSummary();
      await this.initEWSModelRefresh();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  public async getEWSStatus(course_id: string): Promise<EarlyWarningStatus> {
    try {
      const doc = await ewsCourseSummary
        .findOne({
          course_id,
        })
        .orFail();

      if (!doc.status) return "error";

      return doc.status;
    } catch (err) {
      console.error(err);
      return "error";
    }
  }

  public async getEWSResults(course_id: string, privacy: boolean = false) {
    try {
      // Need to lookup the student email from enrollments
      const students = await ewsActorSummary.aggregate([
        {
          $match: {
            course_id,
          },
        },
        {
          $lookup: {
            from: "enrollments",
            localField: "actor_id",
            foreignField: "student_id",
            as: "enrollment",
          },
        },
        {
          $addFields: {
            enrollmentData: {
              $arrayElemAt: ["$enrollment", 0],
            },
          },
        },
        {
          $addFields: {
            name: "$enrollmentData.email",
          },
        },
        {
          $project: {
            enrollment: 0,
            enrollmentData: 0,
          },
        },
      ]);

      const course = await ewsCourseSummary
        .findOne({ course_id: course_id })
        .orFail();

      // All predicted values (that are valid numbers)
      const allPredicted = students
        .map((student) => student.latest_predicted_percent)
        .filter((v) => ![undefined, null].includes(v)) as number[];
      const courseStdDev = parseFloat(
        this.calculateStandardDeviation(allPredicted).toPrecision(2)
      );
      const courseMean = parseFloat(
        this.calculateMean(allPredicted).toPrecision(2)
      );

      const mapped: EWSResult[] = students.map((student) => {
        const courseAvgDiff =
          student.latest_predicted_percent - course.avg_course_percent;
        return {
          student_id: student.actor_id,
          name: student.name,
          estimated_final: student.latest_predicted_percent,
          course_avg_diff: courseAvgDiff,
          z_score: this.calculateZScore(
            student.latest_predicted_percent,
            courseMean,
            courseStdDev
          ),
          status: this._getActorStatusFromPrediction(
            student.latest_predicted_percent
          ),
          course_avg: courseMean,
          course_std_dev: courseStdDev,
        };
      });

      const filtered = mapped.filter(
        (s) => s.z_score < this.EWS_Z_SCORE_THRESHOLDS.WARNING
      ); // only show students with z-score less than warning threshold

      if (privacy) {
        return filtered;
      }

      const promises = filtered.map((s) => {
        return decryptStudent(s.name);
      });

      const decrypted = await Promise.all(promises);
      for (let i = 0; i < filtered.length; i++) {
        filtered[i].name = decrypted[i];
      }

      return filtered;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private async initEWSModelRefresh() {
    try {
      const courses = await ewsCourseSummary.find({}).select("course_id");
      const courseIds = courses.map((course) => course.course_id);

      const ewsAxios = await this.getAxios();
      if (!ewsAxios) {
        throw new Error("Failed to create axios instance");
      }

      const promises = courseIds.map((courseId) => {
        return ewsAxios.post(
          process.env.EWS_API_BASE_URL +
          `/model/${courseId}/batch-predict?force_refresh=true`
        );
      });

      await Promise.allSettled(promises); // ignore errors
    } catch (err) {
      console.error(err);
    }
  }

  public async updateEWSPredictions(
    course_id: string,
    predictions: { [x: string]: number }
  ) {
    try {
      const docsToWrite = Object.entries(predictions).map(
        ([actor_id, latest_predicted_percent]) => ({
          updateOne: {
            filter: {
              actor_id,
              course_id,
            },
            update: {
              $set: {
                latest_predicted_percent: latest_predicted_percent ?? 0,
              },
            },
            upsert: false,
          },
        })
      );

      await ewsActorSummary.bulkWrite(docsToWrite);
    } catch (err) {
      console.error(err);
    }
  }

  private async writeEWSCourseSummary(): Promise<boolean> {
    try {
      this.log("[writeEWSCourseSummary]: Starting aggregation...");
      const coursesWAssignments = await this._getCoursesWithAssignments();

      // Init course summaries
      const courseSummaries: IEWSCourseSummary_Raw[] = coursesWAssignments.map(
        (course) => ({
          course_id: course.course_id,
          assignments: course.assignments.map((a: string) => ({
            assignment_id: a,
            avg_unweighted_score: 0,
            avg_time_on_task: 0,
            avg_time_in_review: 0,
          })),
          avg_course_percent: 0,
          avg_interaction_days: 0,
          avg_percent_seen: 0,
          last_updated: new Date(),
          status: "insufficient-data", // init as insufficient data, will be updated later
        })
      );

      const interactionDays = await this._getCourse_AvgInteractionDays();
      const studentActivity = await this._getCourse_AvgPercentSeen();
      const aggScores = await this._getCourse_AvgScore(coursesWAssignments);
      const reviewTime = await this._getCourse_AvgReviewTime();
      const timeOnTask = await this._getCourse_AvgTimeOnTask();

      for (const summary of courseSummaries) {
        const interaction = interactionDays.find(
          (interaction) => interaction.course_id === summary.course_id
        );
        if (interaction) {
          summary.avg_interaction_days = interaction.avg_interaction_days;
        }

        const percentSeen = studentActivity.find(
          (activity) => activity.course_id === summary.course_id
        );
        if (percentSeen) {
          summary.avg_percent_seen = percentSeen.avg_percent_seen;
        }

        // calculate the average course percent
        summary.avg_course_percent = this._calculateAvgCoursePercent(
          aggScores.filter((score) => score.course_id === summary.course_id)
        );

        for (const assignment of summary.assignments) {
          const score = aggScores.find(
            (score) =>
              score.course_id === summary.course_id &&
              score.assignment_id === assignment.assignment_id
          );
          if (score) {
            assignment.avg_unweighted_score = score.averageScore;
          }

          const inReview = reviewTime.find(
            (time) => time.assignment_id === assignment.assignment_id
          );
          if (inReview) {
            // already in minutes
            assignment.avg_time_in_review = parseFloat(
              inReview.avg_review_time.toFixed(2)
            );
          }

          const onTask = timeOnTask.find(
            (time) => time.assignment_id === assignment.assignment_id
          );
          if (onTask) {
            // convert seconds to minutes
            const converted = parseFloat(
              (onTask.avg_time_on_task / 60).toPrecision(2)
            );
            assignment.avg_time_on_task = converted;
          }
        }
      }

      // filter missing course_id
      const filteredCourseSummaries = courseSummaries.filter(
        (summary) => summary.course_id
      );

      // Update the status of each course summary based on available data
      filteredCourseSummaries.forEach((summary) => {
        this.updateCourseSummaryStatus(summary);
      });

      // Write the course summaries to the database
      await ewsCourseSummary.bulkWrite(
        filteredCourseSummaries.map((summary) => ({
          updateOne: {
            filter: { course_id: summary.course_id },
            update: summary,
            upsert: true,
          },
        }))
      );

      this.log(`[writeEWSCourseSummary]: Finished writing course summaries.`);
      return true;
    } catch (err: any) {
      this.log(
        err.message ?? "Unknown error occured while writing EWS course summary"
      );
      return false;
    }
  }

  private async writeEWSActorSummary(): Promise<boolean> {
    try {
      this.log("[writeEWSActorSummary]: Starting aggregation...");

      const actors = await this._getActor_Actors();
      const coursesWAssignments = await this._getCoursesWithAssignments();
      const actorAssignments = await this._getActor_Assignments();

      const adaptActivity = await calcADAPTStudentActivity.find({
        course_id: {
          $in: coursesWAssignments.map((course) => course.course_id),
        },
      });

      const activityMap = new Map<string, number>();
      for (const activity of adaptActivity) {
        const key = `${activity.student_id}:${activity.course_id}`;
        if (activityMap.has(key)) continue;

        const total = activity.seen.length + activity.unseen.length;

        const percentSeenDecimal = total > 0 ? activity.seen.length / total : 0;
        const percentSeen = (percentSeenDecimal * 100).toFixed(2);
        activityMap.set(key, parseFloat(percentSeen));
      }

      const actorSummaries: IEWSActorSummary_Raw[] = actors.map((actor) => {
        const key = `${actor.student_id}:${actor.course_id}`;
        return {
          actor_id: actor.student_id,
          course_id: actor.course_id,
          // Fill the assignments array with all known assignments for the course
          assignments:
            coursesWAssignments
              .find((course) => course.course_id === actor.course_id)
              ?.assignments.map((a: string) => ({
                assignment_id: a,
                avg_unweighted_score: 0,
                avg_time_on_task: 0,
                avg_time_in_review: 0,
              })) ?? [],
          percent_seen: activityMap.get(key) ?? 0,
          interaction_days: 0,
          course_percent: 0,
          last_updated: new Date(),
        };
      });

      /**
       * get average score for each actor based on the respective actorAssignments percent_correct.
       * Be sure to use the total count of assignments from courseAssignments, in case an actor has not completed all assignments and/or is missing an assignment record.
       * The percentage correct in actorAssignments is formatted as "XX%". Be sure to convert this to a float before calculating the average. If the percentage is null or "-" then it should be treated as 0.
       */
      actorSummaries.forEach((summary) => {
        const actorAssignmentsForActor = actorAssignments.filter(
          (assignment) =>
            assignment.student_id === summary.actor_id &&
            assignment.course_id === summary.course_id
        );

        const course = coursesWAssignments.find(
          (course) => course.course_id === summary.course_id
        );

        const totalAssignments = course ? course.assignments?.length : 0;

        const avgScore =
          actorAssignmentsForActor.reduce((acc, curr) => {
            const percentCorrect = curr.percent_correct.includes("%")
              ? curr.percent_correct.replace("%", "")
              : curr.percent_correct;
            if (!percentCorrect || percentCorrect === "-") {
              return acc;
            }

            const percentCorrectFloat = parseFloat(percentCorrect) / 100;
            return acc + percentCorrectFloat;
          }, 0) / totalAssignments;

        const asPercent = (avgScore * 100).toFixed(2);
        summary.course_percent = parseFloat(asPercent) || 0;
      });

      const avgScorePerAssignment =
        await this._getActor_AvgScorePerAssignment();
      const avgTimeOnTask = await this._getActor_AvgTimeOnTask();
      const interactionDays = await this._getActor_AvgInteractionDays();
      const avgReviewTime = await this._getActor_AvgReviewTime();

      // Set data
      for (const summary of actorSummaries) {
        const interaction = interactionDays.find(
          (interaction) =>
            interaction.student_id === summary.actor_id &&
            interaction.course_id === summary.course_id
        );

        summary.interaction_days = interaction?.days_count || 0;

        // Set data for each assignment
        for (const assignment of summary.assignments) {
          const avgOnTask = avgTimeOnTask.find(
            (time) =>
              time.student_id === summary.actor_id &&
              time.assignment_id === assignment.assignment_id
          );
          const avgInReview = avgReviewTime.find(
            (time) =>
              time.student_id === summary.actor_id &&
              time.assignment_id === assignment.assignment_id
          );

          const avgScore = avgScorePerAssignment.find(
            (score) =>
              score.student_id === summary.actor_id &&
              score.assignment_id === assignment.assignment_id
          );

          if (avgOnTask) {
            // convert to minutes (2 decimal places)
            assignment.avg_time_on_task = parseFloat(
              (avgOnTask.avg_time_on_task / 60).toPrecision(2)
            );
          }
          if (avgInReview) {
            // already in minutes
            assignment.avg_time_in_review = avgInReview.avg_review_time;
          }

          if (avgScore) {
            assignment.avg_unweighted_score = avgScore.avg_score;
          }
        }
      }

      // filter missing actor_id and course_id
      const filteredActorSummaries = actorSummaries.filter(
        (summary) => summary.actor_id && summary.course_id
      );

      // Write the actor summaries to the database
      await ewsActorSummary.bulkWrite(
        filteredActorSummaries.map((summary) => ({
          updateOne: {
            filter: {
              actor_id: summary.actor_id,
              course_id: summary.course_id,
            },
            update: summary,
            upsert: true,
          },
        }))
      );

      this.log(`[writeEWSActorSummary]: Finished writing actor summaries.`);
      return true;
    } catch (err: any) {
      this.log(
        err.message ?? "Unknown error occured while writing EWS actor summary"
      );
      return false;
    }
  }

  private async _getCoursesWithAssignments(): Promise<
    {
      course_id: string;
      assignments: string[];
    }[]
  > {
    return await assignments.aggregate([
      {
        $group: {
          _id: "$course_id",
          assignments: {
            $addToSet: "$assignment_id",
          },
        },
      },
      {
        $project: {
          _id: 0,
          course_id: "$_id",
          assignments: 1,
        },
      },
    ]);
  }

  private async _getActor_Actors() {
    return await enrollments.aggregate([
      {
        // ensure student_id exists
        $match: {
          student_id: {
            $exists: true,
            $ne: "",
          },
        },
      },
      {
        $group: {
          _id: {
            student_id: "$student_id",
            email: "$email",
            course_id: "$course_id",
          },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: "$_id.student_id",
          email: "$_id.email",
          course_id: "$_id.course_id",
        },
      },
    ]);
  }

  private async _getActor_Assignments() {
    return await assignmentScores.aggregate([
      {
        $group: {
          _id: {
            student_id: "$student_id",
            course_id: "$course_id",
            assignment_id: "$assignment_id",
          },
          questions: {
            $first: "$questions",
          },
          percent_correct: {
            $first: "$percent_correct",
          },
          total_points: {
            $first: "$total_points",
          },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: "$_id.student_id",
          course_id: "$_id.course_id",
          assignment_id: "$_id.assignment_id",
          questions: 1,
          percent_correct: 1,
          total_points: 1,
        },
      },
    ]);
  }

  private async _getActor_AvgReviewTime() {
    return await calcReviewTime.aggregate([
      {
        $group: {
          _id: {
            student_id: "$student_id",
            assignment_id: "$assignment_id",
          },
          total_review_time: {
            $sum: "$total_review_time",
          },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: "$_id.student_id",
          assignment_id: "$_id.assignment_id",
          avg_review_time: {
            $avg: "$total_review_time",
          },
        },
      },
    ]);
  }

  private async _getActor_AvgScorePerAssignment() {
    return await assignmentScores.aggregate([
      {
        $unwind: "$questions",
      },
      {
        $group: {
          _id: {
            assignment_id: "$assignment_id",
            student_id: "$student_id",
          },
          avg_score: {
            $avg: {
              $cond: {
                if: {
                  $eq: ["$questions.time_on_task", "-"],
                },
                then: 0,
                else: {
                  $toDouble: "$questions.score",
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: "$_id.student_id",
          assignment_id: "$_id.assignment_id",
          avg_score: 1,
        },
      },
    ]);
  }

  private async _getActor_AvgInteractionDays() {
    return await calcADAPTInteractionDays.aggregate([
      {
        $group: {
          _id: {
            student_id: "$student_id",
            course_id: "$course_id",
          },
          avg_interaction_days: {
            $avg: "$days_count",
          },
        },
      },
      {
        $project: {
          student_id: "$_id.student_id",
          course_id: "$_id.course_id",
          avg_interaction_days: 1,
          _id: 0,
        },
      },
    ]);
  }

  private async _getCourse_AvgReviewTime() {
    return await calcReviewTime.aggregate([
      {
        $group: {
          _id: "$assignment_id",
          avg_review_time: {
            $avg: "$total_review_time",
          },
        },
      },
      {
        $project: {
          assignment_id: {
            $toString: "$_id",
          },
          avg_review_time: 1,
          _id: 0,
        },
      },
    ]);
  }

  private async _getActor_AvgTimeOnTask() {
    return await assignmentScores.aggregate([
      ...PARSE_TIME_ON_TASK_PIPELINE,
      {
        $project: {
          assignment_id: "$assignment_id",
          student_id: "$student_id",
          questions: {
            question_id: "$questions.question_id",
            score: "$questions.score",
            time_on_task: "$questions.time_on_task",
            total_seconds: "$total_seconds",
          },
        },
      },
      {
        $match: {
          "questions.total_seconds": {
            $ne: 0,
          },
        },
      },
      {
        $group: {
          _id: {
            student_id: "$student_id",
            assignment_id: "$assignment_id",
          },
          questions: {
            $push: "$questions",
          },
        },
      },
      {
        $project: {
          _id: 0,
          student_id: "$_id.student_id",
          assignment_id: "$_id.assignment_id",
          avg_time_on_task: {
            $avg: "$questions.total_seconds",
          },
        },
      },
    ]);
  }

  private async _getCourse_AvgInteractionDays() {
    return await calcADAPTInteractionDays.aggregate([
      {
        $group: {
          _id: "$course_id",
          avg_interaction_days: {
            $avg: "$days_count",
          },
        },
      },
      {
        $project: {
          course_id: "$_id",
          avg_interaction_days: 1,
          _id: 0,
        },
      },
    ]);
  }

  private async _getCourse_AvgPercentSeen() {
    return await calcADAPTStudentActivity.aggregate([
      {
        $group: {
          _id: {
            course_id: "$course_id",
          },
          avg_percent_seen: {
            $avg: {
              $divide: [
                {
                  $size: {
                    $setUnion: ["$seen", "$unseen"],
                  },
                },
                {
                  $size: "$seen",
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          course_id: "$_id.course_id",
          avg_percent_seen: 1,
          _id: 0,
        },
      },
    ]);
  }

  private async _getCourse_AvgScore(
    coursesWAssignments: {
      course_id: string;
      assignments: string[];
    }[]
  ) {
    return await calcADAPTScores.aggregate(
      [
        {
          $match: {
            $or: coursesWAssignments.map((c) => ({
              course_id: c.course_id,
              assignment_id: { $in: c.assignments },
            })),
          },
        },
        {
          $unwind: "$scores",
        },
        {
          $group: {
            _id: {
              course_id: "$course_id",
              assignment_id: "$assignment_id",
            },
            averageScore: { $avg: "$scores" },
          },
        },
        {
          $project: {
            _id: 0,
            course_id: "$_id.course_id",
            assignment_id: "$_id.assignment_id",
            averageScore: 1,
          },
        },
      ],
      { allowDiskUse: true }
    );
  }

  private async _getCourse_AvgTimeOnTask() {
    return await calcTimeOnTask.aggregate([
      {
        $group: {
          _id: "$assignment_id",
          avg_time_on_task: {
            $avg: "$total_time_seconds",
          },
        },
      },
      {
        $project: {
          assignment_id: {
            $toString: "$_id",
          },
          avg_time_on_task: 1,
          _id: 0,
        },
      },
    ]);
  }

  private _calculateAvgCoursePercent = (scores: any[]) => {
    // filter out null, undefined and NaN values
    scores = scores.filter((score) => score.averageScore);
    const sum = scores.reduce(
      (acc: number, score: { averageScore: number }) =>
        acc + score.averageScore,
      0
    );
    return sum / scores.length || 0;
  };

  // TODO: Check the logic here
  private updateCourseSummaryStatus(summary: IEWSCourseSummary_Raw) {
    if (summary.avg_course_percent === 0) {
      summary.status = "insufficient-data";
    }
  }

  private _getActorStatusFromPrediction(
    prediction: number
  ): EarlyWarningStatus {
    if (prediction <= this.EWS_THRESHOLDS.DANGER) {
      return "danger";
    } else if (prediction <= this.EWS_THRESHOLDS.WARNING) {
      return "warning";
    } else {
      return "success";
    }
  }

  private calculateMean(values: number[]) {
    return values.reduce((acc, curr) => acc + curr, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]) {
    const avg = this.calculateMean(values);
    const variance = values.reduce(
      (acc, curr) => acc + Math.pow(curr - avg, 2),
      0
    );
    return Math.sqrt(variance / values.length);
  }

  private calculateZScore(value: number, mean: number, stdDev: number) {
    return (value - mean) / stdDev;
  }

  private async getAxios(): Promise<AxiosInstance> {
    const bearer = await this._generateJWT();
    if (!bearer) throw new Error("Failed to generate JWT");

    return axios.create({
      baseURL: process.env.EWS_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });
  }


  private async _generateJWT(): Promise<string | null> {
    const signingKey = process.env.EWS_API_KEY;
    if (!signingKey) return null;

    const secret = new TextEncoder().encode(signingKey);
    return await new jose.SignJWT({
      iss: "learning-analytics-api",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(secret);
  }
}