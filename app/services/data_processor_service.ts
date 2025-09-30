import LTAnalytics from "#mongodb/ltanalytics";
import textbookInteractionsByDate from "#mongodb/textbookInteractionsByDate";
import reviewTime from "#mongodb/reviewTime";
import calcReviewTime from "#mongodb/calcReviewTime";
import assignmentScores from "#mongodb/assignmentScores";
import calcADAPTStudentActivity, {
  ICalcADAPTStudentActivity_Raw,
} from "#mongodb/calcADAPTStudentActivity";
import {
  PARSE_TIME_ON_TASK_PIPELINE,
  removeOutliers,
} from "#utils/data-helpers";
import { EarlyWarningSystemService } from "./early_warning_system_service.js";
import logger from "@adonisjs/core/services/logger";


export class DataProcessorService {
  constructor() { }

  public async runProcessors() {
    try {
      await this.compressADAPTInteractionDays();
      await this.compressADAPTGradeDistribution();
      await this.compressADAPTSubmissions();
      await this.compressADAPTScores();
      await this.compressADAPTStudentActivity(); // this must be ran after compressADAPTScores
      await this.compressTextbookActivityTime();
      await this.compressTextbookInteractionsByDate();
      await this.compressTextbookNumInteractions(); // Should be ran after compressing textbookInteractionsByDate
      await this.compressReviewTime();
      await this.compressTimeOnTask();

      const ews = new EarlyWarningSystemService(); // This should always be the last one
      await ews.updateEWSData();
    } catch (err: any) {
      logger.error(err ?? "Unknown error occured while running processors");
    }
  }

  private async compressADAPTScores(): Promise<boolean> {
    try {
      logger.info("[compressADAPTScores]: Starting aggregation...");
      await assignmentScores.aggregate(
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

      logger.info("[compressADAPTScores]: Finished aggregation.");

      return true;
    } catch (err: any) {
      logger.error(
        err.message ?? "Unknown error occured while compressing ADAPT scores"
      );
      return false;
    }
  }

  private async compressADAPTStudentActivity(): Promise<boolean> {
    try {
      logger.info("[compressADAPTStudentActivity]: Starting aggregation...");

      const courseAssignments = await assignmentScores.aggregate([
        {
          $unwind: "$questions",
        },
        {
          $group: {
            _id: {
              course_id: "$course_id",
              assignment_id: "$assignment_id",
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
            assignment_id: "$_id.assignment_id",
            unique_questions: "$unique_questions",
          },
        },
      ]);

      const hasScoreData = await assignmentScores.aggregate([
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
              assignment_id: "$assignment_id",
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
            assignment_id: "$_id.assignment_id",
            unique_questions: "$unique_questions",
          },
        },
      ]);

      // for each student in each course, find what questions they have seen and not seen (has a score vs no score)
      const studentActivityData: (ICalcADAPTStudentActivity_Raw | null)[] =
        hasScoreData.map((data) => {
          const { course_id, student_id, assignment_id, unique_questions } =
            data;

          const foundAssignment = courseAssignments.find(
            (assignment) =>
              assignment.course_id === course_id &&
              assignment.assignment_id === assignment_id
          );
          if (!foundAssignment) {
            return null;
          }

          const assignmentQuestions =
            (foundAssignment.unique_questions as string[]) || [];

          const seenQuestions = unique_questions;
          const unseenQuestions = assignmentQuestions.filter(
            (questionID: string) => !seenQuestions.includes(questionID)
          );

          return {
            course_id,
            assignment_id,
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
            assignment_id: data.assignment_id,
            student_id: data.student_id,
          },
          update: data,
          upsert: true,
        },
      }));

      // write the data to the database
      await calcADAPTStudentActivity.bulkWrite(bulkWriteData);

      logger.info("[compressADAPTStudentActivity]: Finished aggregation.");
      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing ADAPT student activity"
      );
      return false;
    }
  }

  private async compressADAPTGradeDistribution(): Promise<boolean> {
    try {
      //TODO: USE ASSIGNMENT SCORES INSTEAD OF GRADEBOOK
      await assignmentScores.aggregate(
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

      logger.info("[compressADAPTGradeDistribution]: Finished aggregation.");

      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing ADAPT grade distribution"
      );
      return false;
    }
  }

  private async compressADAPTInteractionDays(): Promise<boolean> {
    try {
      logger.info("[compressADAPTInteractionDays]: Reading raw data...");

      await assignmentScores.aggregate(
        [
          {
            $unwind: {
              path: "$questions",
            },
          },
          {
            $match: {
              "questions.first_submitted_at": {
                $exists: true,
                $ne: "",
              },
              "questions.last_submitted_at": {
                $exists: true,
                $ne: "",
              },
            },
          },
          {
            $addFields: {
              firstSubmittedDay: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $toDate: "$questions.first_submitted_at",
                  },
                },
              },
              lastSubmittedDay: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $toDate: "$questions.last_submitted_at",
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                course_id: "$course_id",
                student_id: "$student_id",
              },
              firstDays: {
                $addToSet: {
                  $toDate: "$firstSubmittedDay",
                },
              },
              lastDays: {
                $addToSet: {
                  $toDate: "$lastSubmittedDay",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              course_id: "$_id.course_id",
              student_id: "$_id.student_id",
              days_count: {
                $size: {
                  $setUnion: ["$firstDays", "$lastDays"],
                },
              },
            },
          },
          {
            $merge: {
              into: "calcADAPTInteractionDays",
              on: ["course_id", "student_id"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      logger.info(`[compressADAPTInteractionDays]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing ADAPT interaction days"
      );
      return false;
    }
  }

  private async compressADAPTSubmissions(): Promise<boolean> {
    try {
      logger.info("[compressADAPTSubmissions]: Starting aggregation...");
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

      logger.info(`[compressADAPTSubmissions]: Finished aggregation.`);

      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing ADAPT submissions"
      );
      return false;
    }
  }

  private async compressTextbookActivityTime(): Promise<boolean> {
    try {
      logger.info("[compressTextbookActivityTime]: Starting aggregation...");
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

      logger.info(`[compressTextbookActivityTime]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing textbook activity time"
      );
      return false;
    }
  }

  private async compressTextbookInteractionsByDate(): Promise<boolean> {
    try {
      logger.info("[compressTextbookInteractionsByDate]: Starting aggregation...");
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
      logger.info(`[compressTextbookInteractionsByDate]: Finished aggregation.`);

      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing textbook interactions"
      );
      return false;
    }
  }

  // Should be ran after compressing textbookInteractionsByDate
  private async compressTextbookNumInteractions(): Promise<boolean> {
    try {
      logger.info("[compressTextbookNumInteractions]: Starting aggregation...");
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

      logger.info(`[compressTextbookNumInteractions]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      logger.error(
        err.message ??
        "Unknown error occured while compressing textbook num interactions"
      );
      return false;
    }
  }

  private async compressReviewTime(): Promise<boolean> {
    try {
      logger.info("[compressReviewTime]: Starting aggregation...");

      const reviewTimeRaw = await reviewTime.aggregate([
        {
          $group: {
            _id: {
              course_id: "$course_id",
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
            course_id: "$_id.course_id",
            questions: {
              $arrayElemAt: ["$questions", 0],
            },
          },
        },
      ]);

      // Returns this format: { student_id: string, assignment_id: string, course_id: string, questions: { question_id: string, review_time_start: string, review_time_end: string}[] }
      const reviewTimeData: {
        student_id: string;
        assignment_id: string;
        course_id: string;
        question_id: string;
        review_time_start: Date;
        review_time_end: Date;
      }[] = reviewTimeRaw.map((data) => {
        const { student_id, assignment_id, course_id, questions } = data;
        return questions.map((question: any) => ({
          student_id,
          assignment_id,
          course_id,
          question_id: question.question_id,
          review_time_start: new Date(question.review_time_start),
          review_time_end: new Date(question.review_time_end),
        }));
      });

      const reviewTimeFlattened = reviewTimeData.flat();

      const reviewTimeAgg = reviewTimeFlattened.reduce((acc, curr) => {
        const key = `${curr.student_id}:${curr.assignment_id}:${curr.course_id}:${curr.question_id}`;
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
          const [student_id, assignment_id, course_id, question_id] =
            key.split(":");
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
            student_id,
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
              student_id: data.student_id,
              assignment_id: data.assignment_id,
              course_id: data.course_id,
              question_id: data.question_id,
            },
            update: data,
            upsert: true,
          },
        }))
      );

      logger.info("[compressReviewTime]: Finished aggregation.");
      return true;
    } catch (err: any) {
      logger.error(
        err.message ?? "Unknown error occured while compressing review time"
      );
      return false;
    }
  }

  private async compressTimeOnTask(): Promise<boolean> {
    try {
      logger.info("[compressTimeOnTask]: Starting aggregation...");

      await assignmentScores.aggregate([
        ...PARSE_TIME_ON_TASK_PIPELINE,
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

      logger.info("[compressTimeOnTask]: Finished aggregation.");
      return true;
    } catch (err: any) {
      logger.error(
        err.message ?? "Unknown error occured while compressing time on task"
      );
      return false;
    }
  }
}
