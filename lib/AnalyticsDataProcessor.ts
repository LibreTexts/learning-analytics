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
import assignmentSubmissions from "./models/assignmentScores";
import assignments from "./models/assignments";
import calcADAPTStudentActivity, {
  ICalcADAPTStudentActivity_Raw,
} from "./models/calcADAPTStudentActivity";
import {
  Assignments_AllCourseQuestionsAggregation,
  removeOutliers,
} from "@/utils/data-helpers";
import assignmentScores from "./models/assignmentScores";
import calcTimeOnTask from "./models/calcTimeOnTask";

class AnalyticsDataProcessor {
  constructor() {}

  public async runProcessors() {
    // await this.compressADAPTAverageScore();
    // await this.compressADAPTInteractionDays();
    // await this.compressADAPTGradeDistribution();
    //await this.compressADAPTSubmissions();
    //await this.compressADAPTScores();
    //await this.compressADAPTStudentActivity(); // this must be ran after compressADAPTScores
    // await this.compressTextbookActivityTime();
    // await this.compressTexbookInteractionsByDate();
    // await this.compressTextbookNumInteractions(); // Should be ran after compressing textbookInteractionsByDate
    //await this.compressReviewTime();
    //await this.compressTimeOnTask();
    await this.writeEWSCourseSummary();
    //await this.writeEWSActorSummary();
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

      const hasScoreData = await assignmentSubmissions.aggregate([
        {
          $unwind: "$questions",
        },
        {
          $match: {
            $expr: {
              $ne: [
                {
                  $convert: {
                    input: "$questions.score",
                    to: "double",
                    onError: null,
                    onNull: null,
                  },
                },
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              course_id: "$course_id",
              student_id: "$student_id",
            },
            unique_questions: {
              $addToSet: "$questions.question_id",
            },
          },
        },
        {
          $project: {
            _id: 0,
            course_id: "$_id.course_id",
            student_id: "$_id.student_id",
            unique_questions: "$unique_questions",
          },
        },
      ]);

      const allCourseQuestions = await assignments.aggregate(
        Assignments_AllCourseQuestionsAggregation
      );

      // for each student in each course, find what questions they have seen and not seen (has a score vs no score)
      const studentActivityData: (ICalcADAPTStudentActivity_Raw | null)[] =
        hasScoreData.map((data) => {
          const { course_id, student_id, unique_questions } = data;
          const courseQuestions = allCourseQuestions.find(
            (course) => course.course_id === course_id
          );
          if (!courseQuestions) {
            return null;
          }

          const seenQuestions = unique_questions;
          const unseenQuestions = courseQuestions.unique_questions
            .map((question: string) => question)
            .filter(
              (questionID: string) => !seenQuestions.includes(questionID)
            );

          return {
            course_id,
            student_id,
            seen: seenQuestions,
            unseen: unseenQuestions,
          };
        });

      // filter out null values
      const filteredStudentActivityData = studentActivityData.filter(
        (data) => data
      ) as ICalcADAPTStudentActivity_Raw[];

      const bulkWriteData = filteredStudentActivityData.map((data) => ({
        updateOne: {
          filter: {
            course_id: data.course_id,
            student_id: data.student_id,
          },
          update: data,
          upsert: true,
        },
      }));

      // write the data to the database
      await calcADAPTStudentActivity.bulkWrite(bulkWriteData);

      debugADP("[compressADAPTStudentActivity]: Finished aggregation.");
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

      // TODO: finish this
      await assignmentScores.aggregate(
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
      await assignmentScores.aggregate(
        [
          {
            $unwind: {
              path: "$questions",
            },
          },
          {
            $project: {
              course_id: 1,
              assignment_id: 1,
              question_id: "$questions.question_id",
              submission_date: {
                $toDate: "$questions.last_submitted_at",
              },
            },
          },
          {
            $match: {
              submission_date: {
                $ne: null,
              },
            },
          },
          {
            $group: {
              _id: {
                course_id: "$course_id",
                assignment_id: "$assignment_id",
                question_id: "$question_id",
              },
              submissions: {
                $push: "$submission_date",
              },
            },
          },
          {
            $group: {
              _id: {
                course_id: "$_id.course_id",
                assignment_id: "$_id.assignment_id",
              },
              questions: {
                $push: {
                  question_id: "$_id.question_id",
                  submissions: "$submissions",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              course_id: "$_id.course_id",
              assignment_id: "$_id.assignment_id",
              questions: 1,
              due_date: { $literal: null },
            },
          },
          {
            $merge: {
              into: "calcADAPTSubmissionsByDate",
              on: ["course_id", "assignment_id"],
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

          // convert to minutes (2 decimal places)
          const totalReviewTime = parseFloat(
            (totalReviewTimeMs / 60000).toPrecision(2)
          );
          return {
            actor,
            assignment_id,
            course_id,
            question_id,
            total_review_time: totalReviewTime,
          };
        }
      );

      // Remove upper outliers
      const cleaned = removeOutliers(
        reviewTimeAggArray,
        "total_review_time",
        true
      );

      await calcReviewTime.bulkWrite(
        cleaned.map((data) => ({
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
      const coursesWAssignments = await adaptCourses.find({});

      console.log(coursesWAssignments);
      const courseAssignmentMap = new Map<string, string[]>();
      coursesWAssignments.forEach((course) => {
        if (!course.assignments || course.assignments.length === 0) {
          courseAssignmentMap.set(course.course_id, []);
          return;
        }

        course.assignments?.forEach((assignment: ADAPTCourseAssignment) => {
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
              avg_time_on_task: 0,
              avg_time_in_review: 0,
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

      const reviewTime = await calcReviewTime.aggregate([
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
            assignment_id: "$_id",
            avg_review_time: 1,
            _id: 0,
          },
        },
      ]);

      courseSummaries.forEach((course) => {
        const courseData = reviewTime.filter((time) =>
          course.assignments
            .map((assignment) => assignment.assignment_id)
            .includes(time.assignment_id)
        ) as { assignment_id: string; avg_review_time: number }[];

        courseData.forEach((data) => {
          const assignment = course.assignments.find(
            (assignment) => assignment.assignment_id === data.assignment_id
          );
          if (assignment) {
            // convert to minutes (2 decimal places)
            assignment.avg_time_in_review = parseFloat(
              (data.avg_review_time / 60000).toPrecision(2)
            );
          }
        });
      });

      const timeOnTask = await calcTimeOnTask.aggregate([
        {
          $group: {
            _id: {
              assignment_id: "$assignment_id",
              question_id: "$question_id",
            },
            avg_time_seconds: {
              $avg: "$total_time_seconds",
            },
          },
        },
        {
          $group: {
            _id: "$_id.assignment_id",
            avg_time_on_task: {
              $avg: "$avg_time_seconds",
            },
          },
        },
        {
          $project: {
            assignment_id: "$_id",
            avg_time_on_task: 1,
            _id: 0,
          },
        },
      ]);

      courseSummaries.forEach((course) => {
        const courseData = timeOnTask.filter((time) =>
          course.assignments
            .map((assignment) => assignment.assignment_id)
            .includes(time.assignment_id)
        ) as { assignment_id: string; avg_time_on_task: number }[];

        courseData.forEach((data) => {
          const assignment = course.assignments.find(
            (assignment) => assignment.assignment_id === data.assignment_id
          );
          if (assignment) {
            assignment.avg_time_on_task = data.avg_time_on_task;
          }
        });
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

      const coursesWAssignments = await adaptCourses.find({});

      //TODO: Should we add per assignment data to EWS model?
      const actorAssignments = await assignmentSubmissions.aggregate([
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

      const adaptActivity = await calcADAPTStudentActivity.find({});
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
          assignments: [],
          percent_seen: activityMap.get(key) ?? 0,
          interaction_days: 0,
          course_percent: 0,
          last_updated: new Date(),
        };
      });

      // TODO: replace this with submission timestamp data from ADAPT
      // const interactionDays = await calcADAPTInteractionDays.aggregate([
      //   {
      //     $group: {
      //       _id: {
      //         actor: "$actor",
      //         courseID: "$courseID",
      //       },
      //       interaction_days: {
      //         $sum: {
      //           $size: "$days",
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: 0,
      //       actor_id: "$_id.actor",
      //       course_id: "$_id.courseID",
      //       interaction_days: 1,
      //     },
      //   },
      // ]);

      // interactionDays.forEach((interaction) => {
      //   const actorSummary = actorSummaries.find(
      //     (summary) =>
      //       summary.actor_id === interaction.actor_id &&
      //       summary.course_id === interaction.course_id
      //   );
      //   if (actorSummary) {
      //     actorSummary.interaction_days = interaction.interaction_days;
      //   }
      // });

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

        const totalAssignments = course
          ? course.assignments.length
          : 0;

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
        summary.course_percent = parseFloat(asPercent);
      });

      const avgTimeOnTask = await assignmentScores.aggregate(
        [
          {
            $unwind: "$questions"
          },
          {
            $addFields: {
              time_parts: {
                $cond: {
                  if: {
                    $eq: ["$questions.time_on_task", "-"]
                  },
                  then: null,
                  else: {
                    $split: [
                      "$questions.time_on_task",
                      ":"
                    ]
                  }
                }
              }
            }
          },
          {
            $addFields: {
              minutes: {
                $cond: {
                  if: {
                    $eq: ["$time_parts", null]
                  },
                  then: 0,
                  else: {
                    $convert: {
                      input: {
                        $arrayElemAt: ["$time_parts", 0]
                      },
                      to: "int",
                      onError: 0,
                      onNull: 0
                    }
                  }
                }
              },
              seconds: {
                $cond: {
                  if: {
                    $eq: ["$time_parts", null]
                  },
                  then: 0,
                  else: {
                    $convert: {
                      input: {
                        $arrayElemAt: ["$time_parts", 1]
                      },
                      to: "int",
                      onError: 0,
                      onNull: 0
                    }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              total_seconds: {
                $add: [
                  {
                    $multiply: ["$minutes", 60]
                  },
                  "$seconds"
                ]
              }
            }
          },
          {
            $match: {
              total_seconds: {
                $type: "number"
              }
            }
          },
          {
            $project: {
              assignment_id: "$assignment_id",
              student_id: "$student_id",
              questions: {
                question_id: "$questions.question_id",
                score: "$questions.score",
                time_on_task: "$questions.time_on_task",
                total_seconds: "$total_seconds"
              }
            }
          },
          {
            $match:
              /**
               * query: The query in MQL.
               */
              {
                "questions.total_seconds": {
                  $ne: 0
                }
              }
          },
          {
            $group: {
              _id: {
                student_id: "$student_id",
                assignment_id: "$assignment_id"
              },
              questions: {
                $push: "$questions"
              }
            }
          },
          {
            $project: {
              _id: 0,
              student_id: "$_id.student_id",
              assignment_id: "$_id.assignment_id",
              avg_time_on_task: {
                $avg: "$questions.total_seconds"
              }
            }
          }
        ]
      )

      // avgTimeOnTask.forEach((time) => {
      //   const actorSummary = actorSummaries.find(
      //     (summary) =>
      //       summary.actor_id === time.student_id &&
      //       summary.course_id === time.course_id
      //   );
      //   if (actorSummary) {
      //     actorSummary.assignments.push({
      //   }
      // });

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
