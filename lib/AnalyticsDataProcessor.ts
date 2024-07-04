import LTAnalytics from "./models/ltanalytics";
import TextbookInteractionsByDate from "./models/textbookInteractionsByDate";
import connectDB from "./database";
import { debugADP } from "@/utils/misc";
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
import assignmentScores from "./models/assignmentScores";
import assignments from "./models/assignments";
import calcADAPTStudentActivity, {
  ICalcADAPTStudentActivity_Raw,
} from "./models/calcADAPTStudentActivity";
import {
  Assignments_AllCourseQuestionsAggregation,
  removeOutliers,
} from "@/utils/data-helpers";
import calcTimeOnTask from "./models/calcTimeOnTask";

class AnalyticsDataProcessor {
  constructor() {}

  public async runProcessors() {
    //await this.compressADAPTInteractionDays();
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

  private async compressADAPTScores(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTScores]: Starting aggregation...");
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

      await assignmentScores.aggregate([
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
          $match: {
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
      const coursesWAssignments = await assignments.aggregate([
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

      // for each course + assignment, find the scores from calcADAPTScores collection and calculate the average score
      const aggScores = await calcADAPTScores.aggregate(
        [
          {
            $match: {
              $or: coursesWAssignments.map(
                ({
                  course_id,
                  assignments,
                }: {
                  course_id: string;
                  assignments: string[];
                }) => ({
                  course_id,
                  assignment_id: { $in: assignments },
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

      // Init course summaries
      const courseSummaries: IEWSCourseSummary_Raw[] = [];
      for (const course of coursesWAssignments) {
        const courseSummary: IEWSCourseSummary_Raw = {
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
        };

        courseSummaries.push(courseSummary);
      }

      const interactionDays = await calcADAPTInteractionDays.aggregate([
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
            _id: 0,
            course_id: "$_id",
            avg_interaction_days: 1,
          },
        },
      ]);

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
            assignment_id: {
              $toString: "$_id",
            },
            avg_review_time: 1,
            _id: 0,
          },
        },
      ]);

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

      const studentActivity = await calcADAPTStudentActivity.aggregate([
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
        )

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
            assignment.avg_time_in_review = parseFloat(inReview.avg_review_time.toFixed(2));
          }

          const onTask = timeOnTask.find(
            (time) => time.assignment_id === assignment.assignment_id
          );
          if (onTask) {
            // convert ms to minutes
            const converted = parseFloat(
              (onTask.avg_time_on_task / 60000).toPrecision(2)
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

      const coursesWAssignments = await assignments.aggregate([
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

      const actorAssignments = await assignmentScores.aggregate([
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
          assignments: coursesWAssignments
            .find((course) => course.course_id === actor.course_id)
            ?.assignments.map((a: string) => ({
              assignment_id: a,
              avg_unweighted_score: 0,
              avg_time_on_task: 0,
              avg_time_in_review: 0,
            })),
          percent_seen: activityMap.get(key) ?? 0,
          interaction_days: 0,
          course_percent: 0,
          last_updated: new Date(),
        };
      });

      const interactionDays = await calcADAPTInteractionDays.aggregate([
        {
          $group: {
            _id: {
              course_id: "$course_id",
              student_id: "$student_id",
            },
            days_count: {
              $first: "$days_count",
            },
          },
        },
        {
          $project: {
            _id: 0,
            student_id: "$_id.student_id",
            course_id: "$_id.course_id",
            days_count: 1,
          },
        },
      ]);

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

      const avgScorePerAssignment = await assignmentScores.aggregate([
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

      const avgTimeOnTask = await assignmentScores.aggregate([
        {
          $unwind: "$questions",
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
          $match: {
            total_seconds: {
              $type: "number",
            },
          },
        },
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

      const avgReviewTime = await calcReviewTime.aggregate([
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
            assignment_id: {
              $toString: "$_id.assignment_id",
            },
            avg_review_time: {
              $avg: "$total_review_time",
            },
          },
        },
      ]);

      // Set data
      for (const summary of actorSummaries) {
        const interaction = interactionDays.find(
          (interaction) =>
            interaction.student_id === summary.actor_id &&
            interaction.course_id === summary.course_id
        );

        summary.interaction_days = interaction.days_count || 0;

        const courseAvg = this._calculateAvgCoursePercent(
          actorAssignments.filter(
            (assignment) =>
              assignment.student_id === summary.actor_id &&
              assignment.course_id === summary.course_id
          )
        );

        summary.course_percent = courseAvg;

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
}

export default AnalyticsDataProcessor;
