import LTAnalytics from "./models/ltanalytics";
import TextbookInteractionsByDate from "./models/textbookInteractionsByDate";
import connectDB from "./database";
import { debugADP } from "@/utils/misc";
import ADAPT from "./models/adapt";
import Gradebook from "./models/gradebook";
import useADAPTAxiosicsAxios from "@/hooks/useADAPTAxios";
import { ADAPTCourseAssignment, IDWithName } from "./types";
import textbookInteractionsByDate from "./models/textbookInteractionsByDate";
import calcADAPTScores from "./models/calcADAPTScores";
import ewsCourseSummary, {
  IEWSCourseSummary_Raw,
} from "./models/ewsCourseSummary";
import ewsActorSummary, {
  IEWSActorSummary_Raw,
} from "./models/ewsActorSummary";
import calcADAPTInteractionDays from "./models/calcADAPTInteractionDays";
import calcADAPTAssignments from "./models/calcADAPTAssignments";
import enrollments from "./models/enrollments";
import reviewTime from "./models/reviewTime";
import calcReviewTime from "./models/calcReviewTime";
import adaptCourses from "./models/adaptCourses";
import assignmentSubmissions from "./models/assignmentSubmissions";

class AnalyticsDataProcessor {
  constructor() {}

  public async runProcessors() {
    // await this.compressADAPTAverageScore();
    // await this.compressADAPTInteractionDays();
    // await this.compressADAPTGradeDistribution();
    // await this.compressADAPTSubmissions();
    //await this.compressADAPTScores();
    //await this.compressADAPTStudentActivity(); // this must be ran after compressADAPTScores
    // await this.compressTextbookActivityTime();
    // await this.compressTexbookInteractionsByDate();
    // await this.compressTextbookNumInteractions(); // Should be ran after compressing textbookInteractionsByDate
    //await this.compressReviewTime();
    await this.compressTimeOnTask();
    // await this.writeEWSCourseSummary();
    // await this.writeEWSActorSummary();
  }

  private async compressADAPTAverageScore(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTAverageScore]: Starting aggregation...");
      await Gradebook.aggregate(
        [
          {
            $group: {
              _id: {
                courseID: "$course_id",
                actor: "$email",
              },
              scores: {
                $push: "$assignment_percent",
              },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id.courseID",
              actor: "$_id.actor",
              avg_score: {
                $round: [
                  {
                    $avg: "$scores",
                  },
                  2,
                ],
              },
            },
          },
          {
            $merge: {
              into: "calcADAPTAverageScore",
              on: ["actor", "courseID"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP("[compressADAPTAverageScore]: Finished aggregation.");
      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT average scores"
      );
      return false;
    }
  }

  private async compressADAPTScores(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTScores]: Starting aggregation...");
      await assignmentSubmissions.aggregate(
        [
          {
            $match: {
              assignment_id: {
                $exists: true,
                $ne: null,
              },
              percent_correct: {
                $regex: "^[0-9]+(\\.[0-9]+)?%$",
              },
            },
          },
          {
            $addFields: {
              percent_correct_stripped: {
                $substr: [
                  "$percent_correct",
                  0,
                  {
                    $subtract: [{ $strLenCP: "$percent_correct" }, 1],
                  },
                ],
              },
            },
          },
          {
            $addFields: {
              percent_correct_float: {
                $convert: {
                  input: "$percent_correct_stripped",
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $match: {
              percent_correct_float: { $ne: null },
            },
          },
          {
            $group: {
              _id: {
                courseID: "$course_id",
                assignmentID: "$assignment_id",
              },
              scores: {
                $push: "$percent_correct_float",
              },
            },
          },
          {
            $project: {
              _id: 0,
              course_id: "$_id.courseID",
              assignment_id: {
                $toString: "$_id.assignmentID",
              },
              scores: 1,
            },
          },
          {
            $merge: {
              into: "calcADAPTScores",
              on: ["course_id", "assignment_id"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP("[compressADAPTScores]: Finished aggregation.");

      return true;
    } catch (err: any) {
      debugADP(
        err.message ?? "Unknown error occured while compressing ADAPT scores"
      );
      return false;
    }
  }

  private async compressADAPTStudentActivity(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTStudentActivity]: Starting aggregation...");

      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT student activity"
      );
      return false;
    }
  }

  private async compressADAPTGradeDistribution(): Promise<boolean> {
    try {
      await connectDB();

      await Gradebook.aggregate(
        [
          {
            $group: {
              _id: {
                course_id: "$course_id",
                email: "$email",
              },
              newestDocument: {
                $last: "$$ROOT",
              },
            },
          },
          {
            $group: {
              _id: "$_id.course_id",
              grades: {
                $push: "$newestDocument.overall_course_grade",
              },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id",
              grades: "$grades",
            },
          },
          {
            $merge: {
              into: "calcADAPTGradeDistribution",
              on: "courseID",
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP("[compressADAPTGradeDistribution]: Finished aggregation.");

      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT grade distribution"
      );
      return false;
    }
  }

  private async compressADAPTInteractionDays(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTInteractionDays]: Reading raw data...");

      await ADAPT.aggregate(
        [
          {
            $match: {
              submission_time: {
                $exists: true,
                $ne: "",
              },
            },
          },
          {
            $addFields: {
              submissionDay: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $toDate: "$submission_time",
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                courseID: "$course_id",
                actor: "$anon_student_id",
              },
              days: {
                $addToSet: {
                  $toDate: "$submissionDay",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id.courseID",
              actor: "$_id.actor",
              days: 1,
              days_count: {
                $size: "$days",
              },
            },
          },
          {
            $merge: {
              into: "calcADAPTInteractionDays",
              on: ["actor", "courseID"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );
      debugADP(`[compressADAPTInteractionDays]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT interaction days"
      );
      return false;
    }
  }

  private async compressADAPTSubmissions(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTSubmissions]: Starting aggregation...");
      await ADAPT.aggregate(
        [
          {
            $match: {
              submission_time: {
                $exists: true,
                $ne: "",
              },
              due: {
                $exists: true,
                $ne: "",
              },
            },
          },
          {
            $addFields: {
              submissionDay: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $toDate: "$submission_time",
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                courseID: "$course_id",
                assignmentID: "$assignment_id",
                date: "$submissionDay",
              },
              submissions: {
                $addToSet: "$id",
              },
              dueDate: {
                $first: "$due",
              },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id.courseID",
              assignmentID: "$_id.assignmentID",
              date: {
                $toDate: "$_id.date",
              },
              dueDate: {
                $toDate: "$dueDate",
              },
              count: {
                $size: "$submissions",
              },
            },
          },
          {
            $merge: {
              into: "calcADAPTSubmissionsByDate",
              on: ["courseID", "assignmentID", "date"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP(`[compressADAPTSubmissions]: Finished aggregation.`);

      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT submissions"
      );
      return false;
    }
  }

  private async compressTextbookActivityTime(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressTextbookActivityTime]: Starting aggregation...");
      await LTAnalytics.aggregate(
        [
          {
            $match: {
              "actor.id": {
                $exists: true,
                $ne: "",
              },
              "actor.courseName": {
                $exists: true,
                $ne: "",
              },
              "object.timeMe": {
                $exists: true,
              },
            },
          },
          {
            $group: {
              _id: {
                actor: "$actor.id",
                textbookID: "$actor.courseName",
              },
              time: {
                $push: "$object.timeMe",
              },
            },
          },
          {
            $project: {
              _id: 0,
              actor: "$_id.actor",
              textbookID: "$_id.textbookID",
              activity_time: {
                $ceil: {
                  $sum: "$time",
                },
              },
            },
          },
          {
            $merge: {
              into: "calcTextbookActivityTime",
              on: ["actor", "textbookID"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP(`[compressTextbookActivityTime]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing textbook activity time"
      );
      return false;
    }
  }

  private async compressTexbookInteractionsByDate(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressTextbookInteractionsByDate]: Starting aggregation...");
      await LTAnalytics.aggregate(
        [
          {
            $match: {
              "object.timestamp": {
                $exists: true,
                $ne: "",
              },
            },
          },
          {
            $addFields: {
              interactionDate: {
                $toDate: "$object.timestamp",
              },
            },
          },
          {
            $group: {
              _id: {
                textbookID: "$actor.courseName",
                date: "$interactionDate",
                actor: "$actor.id",
              },
              numInteractions: {
                $count: {},
              },
            },
          },
          {
            $match: {
              numInteractions: {
                $gt: 0,
              },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id.date",
              actor: "$_id.actor",
              textbookID: "$_id.textbookID",
              numInteractions: 1,
            },
          },
          {
            $out: "textbookInteractionsByDate",
          },
        ],
        { allowDiskUse: true }
      );
      debugADP(`[compressTextbookInteractionsByDate]: Finished aggregation.`);

      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing textbook interactions"
      );
      return false;
    }
  }

  // Should be ran after compressing textbookInteractionsByDate
  private async compressTextbookNumInteractions(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressTextbookNumInteractions]: Starting aggregation...");
      await textbookInteractionsByDate.aggregate(
        [
          {
            $group: {
              _id: {
                actor: "$actor",
                textbookID: "$textbookID",
              },
              totalInteractions: {
                $sum: "$numInteractions",
              },
            },
          },
          {
            $project: {
              _id: 0,
              actor: "$_id.actor",
              textbookID: "$_id.textbookID",
              totalInteractions: "$totalInteractions",
            },
          },
          {
            $merge: {
              into: "calcTextbookNumInteractions",
              on: ["actor", "textbookID"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP(`[compressTextbookNumInteractions]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing textbook num interactions"
      );
      return false;
    }
  }

  private async compressReviewTime(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressReviewTime]: Starting aggregation...");

      const reviewTimeRaw = await reviewTime.aggregate([
        {
          $group: {
            _id: {
              actor: "$actor",
              assignment_id: "$assignment_id",
              course_id: "$course_id",
            },
            questions: {
              $push: "$questions",
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor: "$_id.actor",
            assignment_id: "$_id.assignment_id",
            course_id: "$_id.course_id",
            questions: {
              $arrayElemAt: ["$questions", 0],
            },
          },
        },
      ]);

      // Returns this format: { actor: string, assignment_id: string, course_id: string, questions: { question_id: string, review_time_start: string, review_time_end: string}[] }
      const reviewTimeData: {
        actor: string;
        assignment_id: string;
        course_id: string;
        question_id: string;
        review_time_start: Date;
        review_time_end: Date;
      }[] = reviewTimeRaw.map((data) => {
        const { actor, assignment_id, course_id, questions } = data;
        return questions.map((question: any) => ({
          actor,
          assignment_id,
          course_id,
          question_id: question.question_id,
          review_time_start: new Date(question.review_time_start),
          review_time_end: new Date(question.review_time_end),
        }));
      });

      const reviewTimeFlattened = reviewTimeData.flat();

      const reviewTimeAgg = reviewTimeFlattened.reduce((acc, curr) => {
        const key = `${curr.actor}:${curr.assignment_id}:${curr.course_id}:${curr.question_id}`;
        if (acc.has(key)) {
          acc.get(key)?.push({
            review_time_start: curr.review_time_start,
            review_time_end: curr.review_time_end,
          });
        } else {
          acc.set(key, [
            {
              review_time_start: curr.review_time_start,
              review_time_end: curr.review_time_end,
            },
          ]);
        }
        return acc;
      }, new Map<string, { review_time_start: Date; review_time_end: Date }[]>());

      const reviewTimeAggArray = Array.from(reviewTimeAgg.entries()).map(
        ([key, value]) => {
          const [actor, assignment_id, course_id, question_id] = key.split(":");
          const totalReviewTimeMs = value.reduce((acc, curr) => {
            return (
              acc +
              (curr.review_time_end.getTime() -
                curr.review_time_start.getTime())
            );
          }, 0);

          // convert to minutes
          const totalReviewTime = totalReviewTimeMs / 60000;
          return {
            actor,
            assignment_id,
            course_id,
            question_id,
            total_review_time: totalReviewTime,
          };
        }
      );

      await calcReviewTime.bulkWrite(
        reviewTimeAggArray.map((data) => ({
          updateOne: {
            filter: {
              actor: data.actor,
              assignment_id: data.assignment_id,
              course_id: data.course_id,
              question_id: data.question_id,
            },
            update: data,
            upsert: true,
          },
        }))
      );

      debugADP("[compressReviewTime]: Finished aggregation.");
      return true;
    } catch (err: any) {
      debugADP(
        err.message ?? "Unknown error occured while compressing review time"
      );
      return false;
    }
  }

  private async compressTimeOnTask(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressTimeOnTask]: Starting aggregation...");

      await assignmentSubmissions.aggregate([
        {
          $match: {
            course_id: "2904",
          },
        },
        {
          $unwind: {
            path: "$questions",
          },
        },
        {
          $addFields: {
            time_parts: {
              $cond: {
                if: {
                  $eq: ["$questions.time_on_task", "-"],
                },
                then: null,
                else: {
                  $split: ["$questions.time_on_task", ":"],
                },
              },
            },
          },
        },
        {
          $addFields: {
            minutes: {
              $cond: {
                if: {
                  $eq: ["$time_parts", null],
                },
                then: 0,
                else: {
                  $convert: {
                    input: {
                      $arrayElemAt: ["$time_parts", 0],
                    },
                    to: "int",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
            seconds: {
              $cond: {
                if: {
                  $eq: ["$time_parts", null],
                },
                then: 0,
                else: {
                  $convert: {
                    input: {
                      $arrayElemAt: ["$time_parts", 1],
                    },
                    to: "int",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            total_seconds: {
              $add: [
                {
                  $multiply: ["$minutes", 60],
                },
                "$seconds",
              ],
            },
          },
        },
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              total_seconds: {
                $type: "number",
              },
            },
        },
        {
          $group: {
            _id: "$questions.question_id",
            assignment_id: {
              $first: "$assignment_id",
            },
            course_id: {
              $first: "$course_id",
            },
            total_time_seconds: {
              $sum: "$total_seconds",
            },
          },
        },
        {
          $project: {
            _id: 0,
            course_id: 1,
            assignment_id: 1,
            question_id: "$_id",
            total_time_seconds: 1,
          },
        },
        {
          $merge: {
            into: "calcTimeOnTask",
            on: ["course_id", "assignment_id", "question_id"],
            whenMatched: "replace",
            whenNotMatched: "insert",
          },
        },
      ]);

      debugADP("[compressTimeOnTask]: Finished aggregation.");
      return true;
    } catch (err: any) {
      debugADP(
        err.message ?? "Unknown error occured while compressing time on task"
      );
      return false;
    }
  }

  private async writeEWSCourseSummary(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[writeEWSCourseSummary]: Starting aggregation...");
      const coursesWAssignments = await adaptCourses.find();
      const courseAssignmentMap = new Map<string, string[]>();
      coursesWAssignments.forEach((course) => {
        course.assignments.forEach((assignment: ADAPTCourseAssignment) => {
          if (courseAssignmentMap.has(course.course_id)) {
            courseAssignmentMap
              .get(course.course_id)
              ?.push(assignment.id.toString());
          } else {
            courseAssignmentMap.set(course.course_id, [
              assignment.id.toString(),
            ]);
          }
        });
      });

      // for each course + assignment, find the scores from calcADAPTScores collection and calculate the average score
      const aggScores = await calcADAPTScores.aggregate(
        [
          {
            $match: {
              $or: Array.from(courseAssignmentMap.entries()).map(
                ([courseID, assignmentIDs]) => ({
                  courseID: courseID,
                  assignmentID: { $in: assignmentIDs },
                })
              ),
            },
          },
          {
            $unwind: "$scores",
          },
          {
            $group: {
              _id: {
                courseID: "$courseID",
                assignmentID: "$assignmentID",
              },
              averageScore: { $avg: "$scores" },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id.courseID",
              assignmentID: "$_id.assignmentID",
              averageScore: 1,
            },
          },
        ],
        { allowDiskUse: true }
      );

      const calculateAvgCoursePercent = (scores: any[]) => {
        // filter out null, undefined and NaN values
        scores = scores.filter((score) => score.averageScore);
        const sum = scores.reduce(
          (acc: number, score: { averageScore: number }) =>
            acc + score.averageScore,
          0
        );
        return sum / scores.length || 0;
      };

      const courseSummaries: IEWSCourseSummary_Raw[] = [];
      for (const [courseID, assignmentIDs] of Array.from(
        courseAssignmentMap.entries()
      )) {
        const courseScores = aggScores.filter(
          (score: { courseID: string; assignmentID: string }) =>
            score.courseID === courseID &&
            assignmentIDs.includes(score.assignmentID)
        );

        const courseSummary: IEWSCourseSummary_Raw = {
          course_id: courseID,
          assignments: courseScores.map(
            (score: { assignmentID: string; averageScore: number }) => ({
              assignment_id: score.assignmentID,
              avg_score: score.averageScore,
            })
          ),
          avg_course_percent: calculateAvgCoursePercent(courseScores),
          avg_interaction_days: 0,
          avg_percent_seen: 0,
          last_updated: new Date(),
          status: "insufficient-data", // set this for now, we will update with updateCourseSummaryStatus below
        };

        courseSummaries.push(courseSummary);
      }

      const interactionDays = await calcADAPTInteractionDays.aggregate([
        {
          $group: {
            _id: "$courseID",
            avg_interaction_days: {
              $avg: {
                $size: "$days",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id",
            avg_interaction_days: 1,
          },
        },
      ]);

      interactionDays.forEach((course) => {
        const courseSummary = courseSummaries.find(
          (summary) => summary.course_id === course.courseID
        );
        if (courseSummary) {
          courseSummary.avg_interaction_days = course.avg_interaction_days;
        }
      });

      /* for percent seen, from adaptCourses, we can get the number of assignments for each course
      and from calcADAPTAssignments, we can get the number of assignments completed by each student in each course.
      Then, we can calculate the average percent seen for each course. */

      const courseAssignments = await adaptCourses.find();
      const courseAssignmentsMap = new Map<string, number>();
      courseAssignments.forEach((course) => {
        courseAssignmentsMap.set(
          course.courseID,
          course.assignments.length ?? 0
        );
      });

      const courseAssignmentsCompleted = await calcADAPTAssignments.aggregate([
        {
          $group: {
            _id: "$courseID",
            avg_percent_seen: { $avg: "$assignments_count" },
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id",
            avg_percent_seen: 1,
          },
        },
      ]);

      courseAssignmentsCompleted.forEach((course) => {
        const courseSummary = courseSummaries.find(
          (summary) => summary.course_id === course.courseID
        );
        if (courseSummary) {
          courseSummary.avg_percent_seen = course.avg_percent_seen;
        }
      });

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

      debugADP(`[writeEWSCourseSummary]: Finished writing course summaries.`);
      return true;
    } catch (err: any) {
      debugADP(
        err.message ?? "Unknown error occured while writing EWS course summary"
      );
      return false;
    }
  }

  private async writeEWSActorSummary(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[writeEWSActorSummary]: Starting aggregation...");
      const actors = await enrollments.aggregate([
        {
          $group: {
            _id: {
              email: "$email",
              courseID: "$courseID",
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor_id: "$_id.email",
            course_id: "$_id.courseID",
          },
        },
      ]);

      const actorWCourses = new Map<string, string[]>();
      actors.forEach((actor) => {
        if (actorWCourses.has(actor.actor_id)) {
          actorWCourses.get(actor.actor_id)?.push(actor.course_id);
        } else {
          actorWCourses.set(actor.actor_id, [actor.course_id]);
        }
      });

      const actorAssignments = await calcADAPTAssignments.aggregate(
        [
          {
            $match: {
              $or: Array.from(actorWCourses.entries()).map(
                ([actorID, courseIDs]) => ({
                  actor: actorID,
                  courseID: { $in: courseIDs },
                })
              ),
            },
          },
        ],
        {
          allowDiskUse: true,
        }
      );

      const actorSummaries: IEWSActorSummary_Raw[] = [];
      const assignmentsByActorIdCourseId = new Map<string, any[]>();
      for (const [actorID, courseIDs] of Array.from(actorWCourses.entries())) {
        for (const courseID of courseIDs) {
          const actorCourseAssignments = actorAssignments.filter(
            (assignment: { actor: string; courseID: string }) =>
              assignment.actor === actorID && assignment.courseID === courseID
          );

          const actorSummary: IEWSActorSummary_Raw = {
            actor_id: actorID,
            course_id: courseID,
            percent_seen: 0,
            interaction_days: 0,
            course_percent: 0,
          };
          assignmentsByActorIdCourseId.set(
            `${actorID}:${courseID}`,
            actorCourseAssignments
              .at(0)
              ?.assignments.map(
                (assignment: { assignment_id: string; score: number }) => ({
                  assignment_id: assignment.assignment_id,
                  score: isNaN(assignment.score) ? 0 : assignment.score,
                })
              ) || []
          );

          actorSummaries.push(actorSummary);
        }
      }

      const interactionDays = await calcADAPTInteractionDays.aggregate([
        {
          $group: {
            _id: {
              actor: "$actor",
              courseID: "$courseID",
            },
            interaction_days: {
              $sum: {
                $size: "$days",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor_id: "$_id.actor",
            course_id: "$_id.courseID",
            interaction_days: 1,
          },
        },
      ]);

      interactionDays.forEach((interaction) => {
        const actorSummary = actorSummaries.find(
          (summary) =>
            summary.actor_id === interaction.actor_id &&
            summary.course_id === interaction.course_id
        );
        if (actorSummary) {
          actorSummary.interaction_days = interaction.interaction_days;
        }
      });

      const courseAssignments = await adaptCourses.aggregate([
        {
          $group: {
            _id: "$course_id",
            assignments_count: {
              $sum: {
                $size: "$assignments",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id",
            assignments_count: 1,
          },
        },
      ]);

      const courseAssignmentsMap = new Map<string, number>();
      courseAssignments.forEach((course) => {
        courseAssignmentsMap.set(course.courseID, course.assignments_count);
      });

      actorSummaries.forEach((actorSummary) => {
        const courseID = actorSummary.course_id;
        const assignmentsCount = courseAssignmentsMap.get(courseID) ?? 0;
        const foundAssignments = assignmentsByActorIdCourseId.get(
          `${actorSummary.actor_id}:${courseID}`
        );
        actorSummary.percent_seen =
          ((foundAssignments?.length ?? 0) / assignmentsCount) * 100 || 0;
      });

      // For course_percent, find the latest gradebook entry for each actor in each course and use the overall_course_percent
      const latestGradebookEntries = await Gradebook.aggregate([
        {
          $group: {
            _id: {
              actor: "$email",
              courseID: "$course_id",
            },
            newestDocument: {
              $last: "$$ROOT",
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor_id: "$_id.actor",
            course_id: "$_id.courseID",
            course_percent: "$newestDocument.overall_course_percent",
          },
        },
      ]);

      latestGradebookEntries.forEach((entry) => {
        const actorSummary = actorSummaries.find(
          (summary) =>
            summary.actor_id === entry.actor_id &&
            summary.course_id === entry.course_id
        );
        if (actorSummary) {
          actorSummary.course_percent = entry.course_percent;
        }
      });

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

      debugADP(`[writeEWSActorSummary]: Finished writing actor summaries.`);
      return true;
    } catch (err: any) {
      debugADP(
        err.message ?? "Unknown error occured while writing EWS actor summary"
      );
      return false;
    }
  }

  // TODO: Check the logic here
  private updateCourseSummaryStatus(summary: IEWSCourseSummary_Raw) {
    if (summary.avg_course_percent === 0) {
      summary.status = "insufficient-data";
    }
  }
}

export default AnalyticsDataProcessor;
