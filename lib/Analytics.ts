import connectDB from "@/lib/database";
import AdaptCodes from "@/lib/models/adaptCourses";
import Enrollments from "@/lib/models/enrollments";
import TextbookInteractionsByDate from "@/lib/models/textbookInteractionsByDate";
import {
  ADAPTCourseAssignment,
  ActivityAccessed,
  AnalyticsRawData,
  GradeDistribution,
  IDWithName,
  IDWithText,
  LOCData,
  PerformancePerAssignment,
  Student,
  SubmissionTimeline,
  TextbookInteractionsCount,
  TimeInReview,
  TimeOnTask,
} from "@/lib/types";
import { getPaginationOffset } from "@/utils/misc";
import calcADAPTSubmissionsByDate, {
  ICalcADAPTSubmissionsByDate_Raw,
} from "./models/calcADAPTSubmissionsByDate";
import calcTextbookActivityTime from "./models/calcTextbookActivityTime";
import { decryptStudent, mmssToSeconds } from "@/utils/data-helpers";
import calcADAPTGradeDistribution from "./models/calcADAPTGradeDistribution";
import CourseAnalyticsSettings, {
  ICourseAnalyticsSettings_Raw,
} from "./models/courseAnalyticsSettings";
import ewsActorSummary from "./models/ewsActorSummary";
import adaptCourses from "@/lib/models/adaptCourses";
import frameworkQuestionAlignment from "./models/frameworkQuestionAlignment";
import calcReviewTime from "./models/calcReviewTime";
import calcADAPTScores from "./models/calcADAPTScores";
import assignmentScores, {
  IAssignmentScoresRaw,
} from "./models/assignmentScores";
import assignments from "./models/assignments";
import calcTimeOnTask from "./models/calcTimeOnTask";
import calcADAPTStudentActivity from "./models/calcADAPTStudentActivity";
import framework, { IFramework_Raw } from "./models/framework";
import frameworkLevels, {
  IFrameworkLevel_Raw,
  IFrameworkDescriptor_Raw,
} from "./models/frameworkLevels";

class Analytics {
  private adaptID: number;
  constructor(_adaptID?: string) {
    if (!_adaptID) {
      throw new Error("ADAPT ID is required");
    }
    const parsed = parseInt(_adaptID.toString().trim());
    if (isNaN(parsed)) {
      throw new Error("Invalid ADAPT ID");
    }
    this.adaptID = parsed;
  }

  public async getAssignments(ignoreExclusions = false): Promise<IDWithName[]> {
    try {
      await connectDB();
      // find all assignments with the courseId = this.adaptID and count the unique assignment_id 's
      const res = await assignments.find({
        course_id: this.adaptID.toString(),
      });

      // sort the assignments by name
      res.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      const mapped =
        res.map((d) => ({
          id: d.assignment_id.toString(),
          name: d.name,
        })) ?? [];

      if (ignoreExclusions) {
        return mapped;
      }

      // Filter out assignments that are excluded
      const assignmentExclusions = await this._getAssignmentExclusions();
      return mapped.filter(
        (d) => !assignmentExclusions.find((a) => a.id === d.id)
      );
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public async countEnrolledStudents(): Promise<number> {
    try {
      await connectDB();

      const res = await Enrollments.countDocuments({
        course_id: this.adaptID.toString(),
      });

      return res ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async getTotalQuestionsCount(): Promise<number> {
    try {
      await connectDB();

      const res = await assignments.find({
        course_id: this.adaptID.toString(),
      });

      const total = res.reduce((acc: number, curr: ADAPTCourseAssignment) => {
        return acc + curr.num_questions ?? 0;
      }, 0);

      return total ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async getCourseId(): Promise<string | undefined> {
    try {
      await connectDB();

      const res = await AdaptCodes.findOne({
        adaptCode: this.adaptID.toString(),
      }).select("courseId");

      return res.courseId;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  public async getADAPTActivity(
    student_id: string,
    assignment_id: string
  ): Promise<ActivityAccessed> {
    try {
      await connectDB();

      const studentAssignment = await calcADAPTStudentActivity.findOne({
        course_id: this.adaptID.toString(),
        assignment_id: assignment_id,
        student_id: student_id,
      });

      if (!studentAssignment) {
        return {
          seen: [],
          unseen: [],
        };
      }

      return {
        seen: studentAssignment.seen,
        unseen: studentAssignment.unseen,
      };
    } catch (err) {
      console.error(err);
      return {
        seen: [],
        unseen: [],
      };
    }
  }

  public async getADAPTPerformance(assignment_id: string): Promise<number[]> {
    try {
      await connectDB();

      const assignment = await assignmentScores.findOne({
        assignment_id: assignment_id,
      });

      if (!assignment || !assignment.assignment_name) {
        throw new Error("Assignment not found");
      }

      const res = await assignmentScores.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
            assignment_name: assignment.assignment_name,
          },
        },
        {
          $group: {
            _id: "$assignment_name",
            scores: {
              $push: "$assignment_percent",
            },
          },
        },
      ]);

      const scores = res[0].scores as number[];

      return scores;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public async getGradeDistribution(): Promise<GradeDistribution> {
    try {
      await connectDB();

      const courseData = await adaptCourses.findOne({
        courseID: this.adaptID.toString(),
      });

      if (!courseData?.letter_grades_released) {
        return {
          grades: [],
          letter_grades_released: false,
        };
      }

      const res = await calcADAPTGradeDistribution.find({
        courseID: this.adaptID.toString(),
      });

      const grades = (res[0].grades as string[]) || [];
      return {
        grades: grades,
        letter_grades_released: true,
      };
    } catch (err) {
      console.error(err);
      return {
        grades: [],
        letter_grades_released: false,
      };
    }
  }

  public async getPerformancePerAssignment(
    emailToCompare?: string
  ): Promise<PerformancePerAssignment[]> {
    try {
      if (!emailToCompare) {
        return [];
      }

      await connectDB();

      const classAvgPromise = calcADAPTScores.aggregate([
        { $match: { course_id: this.adaptID.toString() } },
        { $unwind: "$scores" },
        {
          $group: {
            _id: "$assignment_id",
            avg_score: { $avg: "$scores" },
          },
        },
      ]);

      const studentScorePromise = assignmentScores.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
            student_id: emailToCompare,
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
            _id: "$assignment_id",
            avg_score: {
              $avg: "$percent_correct_float",
            },
          },
        },
      ]);

      const [classAvg, studentScore] = await Promise.all([
        classAvgPromise,
        studentScorePromise,
      ]);

      const classAvgMap = new Map<string, number>();
      classAvg.forEach((d) => {
        classAvgMap.set(d._id, d.avg_score);
      });

      const studentScoreMap = new Map<string, number>();
      studentScore.forEach((d) => {
        studentScoreMap.set(d._id, d.avg_score);
      });

      const res: PerformancePerAssignment[] = [];
      classAvgMap.forEach((v, k) => {
        res.push({
          assignment_id: k,
          class_avg: v,
          student_score: studentScoreMap.get(k) ?? 0,
        });
      });

      res.sort((a, b) => a.assignment_id.localeCompare(b.assignment_id));

      const truncated = res.map((d) => ({
        assignment_id: d.assignment_id,
        class_avg: Math.round(d.class_avg * 100) / 100, // round to two decimal places
        student_score: Math.round(d.student_score * 100) / 100, // round to two decimal places
      }));

      truncated.sort((a, b) =>
        a.assignment_id.localeCompare(b.assignment_id, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      // Filter out assignments that are excluded
      const assignmentExclusions = await this._getAssignmentExclusions();
      return truncated.filter(
        (d) => !assignmentExclusions.find((a) => a.id === d.assignment_id)
      );
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public async getTextbookEngagement(): Promise<TextbookInteractionsCount[]> {
    try {
      await connectDB();
      const courseId = await this.getCourseId();
      if (!courseId) {
        throw new Error("Course ID not found");
      }

      const res = await TextbookInteractionsByDate.aggregate([
        {
          $match: {
            textbookID: courseId,
          },
        },
        {
          $addFields: {
            parsedTimestamp: {
              $toDate: "$date",
            },
          },
        },
        {
          $match: {
            parsedTimestamp: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2023-01-31"),
            },
          },
        },
      ]);

      // res.sort((a, b) => a.date.localeCompare(b.date));

      return res.map((d) => ({
        date: d.date,
        numInteractions: d.numInteractions,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public async getSubmissionTimeline(
    assignment_id: string
  ): Promise<SubmissionTimeline | undefined> {
    try {
      await connectDB();

      const res = (await calcADAPTSubmissionsByDate.find({
        course_id: this.adaptID.toString(),
        assignment_id: assignment_id,
      })) as ICalcADAPTSubmissionsByDate_Raw[];

      const assignmentInfo = await assignments.findOne({
        course_id: this.adaptID.toString(),
        assignment_id: assignment_id,
      });

      // for each question, count the number of occurrences of each date, without regard to the time (date only)
      const data = res.map((d) => {
        return d.questions.map((q) => {
          return {
            question_id: q.question_id,
            data: q.submissions.reduce((acc, curr) => {
              const date = new Date(curr).toLocaleDateString();
              const existing = acc.find((a) => a.date === date);
              if (existing) {
                existing.count++;
              } else {
                acc.push({ date: date, count: 1 });
              }
              return acc;
            }, [] as { date: string; count: number }[]),
          };
        });
      });

      // return the data with respect to the assignment as a whole, not individual questions
      // so for each date, sum the counts of all questions
      // const flattened = data.reduce((acc, curr) => {
      //   curr.data.forEach((d) => {
      //     const existing = acc.find((a) => a.date === d.date);
      //     if (existing) {
      //       existing.count += d.count;
      //     } else {
      //       acc.push({ date: d.date, count: d.count });
      //     }
      //   });
      //   return acc;
      // }, [] as { date: string; count: number }[]);

      return {
        assignment_id: assignment_id,
        due_date: assignmentInfo?.due_date,
        final_submission_deadline: assignmentInfo?.final_submission_deadline,
        questions: data.flat(),
      };
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  public async getStudents(
    page = 1,
    limit = 100,
    privacyMode = true
  ): Promise<Student[]> {
    try {
      await connectDB();

      const offset = getPaginationOffset(page, limit);

      const res = await Enrollments.find({
        course_id: this.adaptID.toString(),
      })
        .skip(offset)
        .limit(limit);

      if (privacyMode) {
        return res.map((d) => ({
          id: d.student_id,
          email: d.email,
          name: d.email,
        }));
      }

      return await Promise.all(
        res.map(async (d) => ({
          id: d.student_id,
          email: d.email,
          name: await decryptStudent(d.email),
        }))
      );
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public async getStudentTextbookEngagement(
    student_id: string
  ): Promise<number> {
    try {
      await connectDB();

      const courseId = await this.getCourseId();
      if (!courseId) {
        throw new Error("Course ID not found");
      }

      const res = await calcTextbookActivityTime.findOne({
        actor: student_id,
        textbookID: courseId,
      });

      return Math.ceil(res?.activity_time / 60) ?? 0; // Convert seconds to minutes
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async getStudentAssignmentsCount(student_id: string): Promise<number> {
    try {
      await connectDB();

      const res = await assignmentScores.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
            student_id: student_id,
          },
        },
        { $group: { _id: "$assignment_id" } },
        { $count: "unique_assignments" },
      ]);

      return res[0]?.unique_assignments ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async getStudentAverageScore(student_id: string): Promise<number> {
    try {
      await connectDB();

      const studentScoreCalc = await assignmentScores.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
            student_id: student_id,
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
                  $subtract: [
                    {
                      $strLenCP: "$percent_correct",
                    },
                    1,
                  ],
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
            percent_correct_float: {
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: null,
            avg_score: {
              $avg: "$percent_correct_float",
            },
          },
        },
      ]);

      const result = studentScoreCalc[0]?.avg_score ?? 0;
      return parseFloat(result.toPrecision(2));
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async getCourseFrameworkData(): Promise<{
    descriptors: IDWithText[];
    levels: IDWithText[];
  }> {
    try {
      await connectDB();

      // need to get all course assignments first
      const courseAssignments = await assignments.find({
        course_id: this.adaptID.toString(),
      });

      const res = await frameworkQuestionAlignment.find({
        assignment_id: { $in: courseAssignments.map((d) => d.assignment_id) },
      });

      const frameworkDescriptors = res.reduce((acc, curr) => {
        curr.framework_descriptors.forEach((d: IDWithText) => {
          if (
            !acc.find((f: IDWithText) => f.id === d.id && f.text === d.text)
          ) {
            acc.push(d);
          }
        });
        return acc;
      }, [] as IDWithText[]);

      const frameworkLevels = res.reduce((acc, curr) => {
        curr.framework_levels.forEach((d: IDWithText) => {
          if (
            !acc.find((f: IDWithText) => f.id === d.id && f.text === d.text)
          ) {
            acc.push(d);
          }
        });
        return acc;
      }, [] as IDWithText[]);

      frameworkDescriptors.sort((a: IDWithText, b: IDWithText) =>
        a.text.localeCompare(b.text)
      );
      frameworkLevels.sort((a: IDWithText, b: IDWithText) =>
        a.text.localeCompare(b.text)
      );

      // Stringify id before returning
      return {
        descriptors: frameworkDescriptors.map((d: IDWithText) => ({
          id: d.id.toString(),
          text: d.text,
        })),
        levels: frameworkLevels.map((d: IDWithText) => ({
          id: d.id.toString(),
          text: d.text,
        })),
      };
    } catch (err) {
      console.error(err);
      return {
        descriptors: [],
        levels: [],
      };
    }
  }

  public async getCourseAnalyticsSettings(): Promise<ICourseAnalyticsSettings_Raw | null> {
    try {
      await connectDB();

      const res = await CourseAnalyticsSettings.findOne({
        courseID: this.adaptID.toString(),
      });

      if (!res) {
        return null;
      }

      return JSON.parse(JSON.stringify(res));
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  public async updateCourseAnalyticsSettings(
    newSettings: Partial<ICourseAnalyticsSettings_Raw>
  ): Promise<boolean> {
    try {
      await connectDB();

      console.log(newSettings);

      const res = await CourseAnalyticsSettings.updateOne(
        {
          courseID: this.adaptID.toString(),
        },
        newSettings,
        { upsert: true } // if course settings do not exist, create a new doc
      );

      return res.modifiedCount === 1;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  public async getRawData(privacy_mode: boolean): Promise<AnalyticsRawData[]> {
    try {
      await connectDB();

      const res = await ewsActorSummary.find({
        course_id: this.adaptID.toString(),
      });

      // Calculate course percentile and quartile
      const allScores = res.map((d) => d.course_percent);
      const sortedScores = allScores.sort((a, b) => a - b);

      const getQuartile = (score: number) => {
        const quartile = Math.floor(
          (sortedScores.indexOf(score) / allScores.length) * 4
        );
        return quartile === 4 ? 3 : quartile;
      };

      const avgTimeOnTask = (await assignmentScores.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
          },
        },
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
      ])) as {
        student_id: string;
        assignment_id: string;
        avg_time_on_task: number;
      }[];

      const avgReviewTime = (await calcReviewTime.aggregate([
        {
          $match: {
            course_id: this.adaptID,
          },
        },
        {
          $group: {
            _id: {
              student_id: "$student_id",
              assignment_id: "$assignment_id",
            },
            avg_review_time: {
              $avg: "$total_review_time",
            },
          },
        },
        {
          $project: {
            student_id: "$_id.student_id",
            assignment_id: {
              $toString: "$_id.assignment_id",
            },
            avg_review_time: 1,
            _id: 0,
          },
        },
      ])) as {
        student_id: string;
        assignment_id: string;
        avg_review_time: number;
      }[];

      const allCourseActivity = await calcADAPTStudentActivity
        .find({
          course_id: this.adaptID.toString(),
        })
        .lean();

      const data = res.map((d) => {
        const timeOnTask = avgTimeOnTask.find(
          (a) => a.student_id === d.actor_id
        );
        const onTaskToMinutes = parseFloat(
          ((timeOnTask?.avg_time_on_task ?? 0) / 60).toPrecision(2)
        );

        const reviewTime = avgReviewTime.find(
          (a) => a.student_id === d.actor_id
        );
        const reviewTimeRounded = parseFloat(
          (reviewTime?.avg_review_time ?? 0).toPrecision(2)
        );

        const activity = allCourseActivity.find(
          (a) => a.student_id === d.actor_id
        );

        return {
          actor_id: d.actor_id,
          name: d.actor_id,
          pages_accessed: 0,
          unique_interaction_days: 0,
          not_submitted: activity?.unseen.length ?? 0,
          submitted: activity?.seen.length ?? 0,
          avg_time_on_task: onTaskToMinutes,
          avg_time_in_review: reviewTimeRounded,
          course_percent: d.course_percent,
          class_quartile: getQuartile(d.course_percent),
        };
      });

      if (privacy_mode) {
        return data;
      }

      const decrypted = await Promise.all(
        data.map(async (d) => ({
          ...d,
          name: await decryptStudent(d.actor_id),
        }))
      );

      return decrypted.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  public async getAssignmentFrameworkData(
    assignment_id: string | number
  ): Promise<{
    framework_descriptors: IDWithText<number>[];
    framework_levels: IDWithText<number>[];
  }> {
    try {
      await connectDB();

      const res = await frameworkQuestionAlignment.find({
        assignment_id: parseInt(assignment_id.toString()),
      });

      if (res.length === 0) {
        return {
          framework_descriptors: [],
          framework_levels: [],
        };
      }

      const assignmentData = res.reduce(
        (acc, curr) => {
          curr.framework_descriptors.forEach((d: IDWithText<number>) => {
            if (
              !acc.framework_descriptors.find(
                (f: IDWithText<number>) => f.id === d.id
              )
            ) {
              acc.framework_descriptors.push(d);
            }
          });
          curr.framework_levels.forEach((d: IDWithText<number>) => {
            if (
              !acc.framework_levels.find(
                (f: IDWithText<number>) => f.id === d.id
              )
            ) {
              acc.framework_levels.push(d);
            }
          });
          return acc;
        },
        {
          framework_descriptors: [],
          framework_levels: [],
        }
      );

      const frameworkExclusions = await this._getFrameworkExclusions();

      const filteredDescriptors = assignmentData.framework_descriptors.filter(
        (d: IDWithText<number>) => {
          return (
            frameworkExclusions?.find((f) => f.text === d.text) === undefined
          );
        }
      );
      const filteredLevels = assignmentData.framework_levels.filter(
        (d: IDWithText<number>) => {
          return (
            frameworkExclusions?.find((f) => f.text === d.text) === undefined
          );
        }
      );

      // Convert to POJO (_id in subdocuments will cause call stack overflow)
      return {
        framework_descriptors: JSON.parse(JSON.stringify(filteredDescriptors)),
        framework_levels: JSON.parse(JSON.stringify(filteredLevels)),
      };
    } catch (err) {
      console.error(err);
      return {
        framework_descriptors: [],
        framework_levels: [],
      };
    }
  }

  public async checkFinalGradesReleased(): Promise<boolean> {
    try {
      await connectDB();

      const res = await adaptCourses.findOne({
        courseID: this.adaptID.toString(),
      });

      return res?.letter_grades_released ?? false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  public async getTimeInReview(
    student_id: string,
    assignment_id: string
  ): Promise<TimeInReview[]> {
    try {
      type _StudentData = {
        question_id: number;
        total_review_time: number;
      };

      type _QuestionData = {
        question_id: number;
        total_review_time: number;
      };

      await connectDB();

      const studentRes = await calcReviewTime.find({
        course_id: this.adaptID,
        student_id,
        assignment_id: parseInt(assignment_id),
      });

      const courseRes = await calcReviewTime.find({
        course_id: this.adaptID,
        assignment_id: parseInt(assignment_id),
      });

      const studentData = studentRes.map((d) => ({
        question_id: d.question_id,
        total_review_time: d.total_review_time,
      })) as _StudentData[];

      // calculate the grand total review time for each question
      const courseData = courseRes.reduce((acc, curr) => {
        const existing = acc.find(
          (a: _QuestionData) => a.question_id === curr.question_id
        );
        if (existing) {
          existing.total_review_time += curr.total_review_time;
        } else {
          acc.push({
            question_id: curr.question_id,
            total_review_time: curr.total_review_time,
          });
        }
        return acc;
      }, [] as _QuestionData[]);

      // Calculate the average review time for each question
      const courseDataAvg = courseData.map((d: _QuestionData) => {
        const totalStudents = courseRes.length || 0;

        const avg = totalStudents > 0 ? d.total_review_time / totalStudents : 0;

        return {
          question_id: d.question_id,
          total_review_time: avg,
        };
      }) as _QuestionData[];

      const mapped = studentData.map((d) => ({
        question_id: d.question_id,
        student_time: d.total_review_time,
        course_avg:
          courseDataAvg.find(
            (c: _QuestionData) => c.question_id === d.question_id
          )?.total_review_time ?? 0, // find the corresponding course avg
      }));

      if (mapped.length === 0) {
        return courseDataAvg.map((d: any) => ({
          question_id: d.question_id,
          student_time: 0,
          course_avg: d.total_review_time,
        }));
      }

      return mapped;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getTimeOnTask(
    student_id: string,
    assignment_id: string
  ): Promise<TimeOnTask[]> {
    try {
      await connectDB();

      const enrollments = await Enrollments.find({
        course_id: this.adaptID.toString(),
      });

      const courseTotals = await calcTimeOnTask.find({
        course_id: this.adaptID,
        assignment_id,
      });

      //for each question, divide the total review time by the number of students
      const courseAvg = courseTotals.map((d) => {
        if (!isNaN(d.total_time_seconds) && enrollments.length > 0) {
          return {
            question_id: d.question_id,
            avg_time_seconds: d.total_time_seconds / enrollments.length,
          };
        }

        return {
          question_id: d.question_id,
          avg_time_seconds: 0,
        };
      });

      const studentData = await assignmentScores.find({
        course_id: this.adaptID.toString(),
        student_id,
        assignment_id,
      });

      const studentQuestions = studentData.map((d) => {
        if (Array.isArray(d.questions)) {
          return d.questions.flat();
        }
        return [];
      });

      const flattened = studentQuestions.flat();

      const studentTime = flattened.map((d) => ({
        question_id: d.question_id,
        time_seconds: mmssToSeconds(d.time_on_task) ?? 0,
      }));

      const mapped = studentTime.map((d) => ({
        question_id: d.question_id,
        student_time: d.time_seconds,
        course_avg:
          courseAvg.find((c) => c.question_id === d.question_id)
            ?.avg_time_seconds ?? 0,
      }));

      const toMinutes = mapped.map((d) => ({
        question_id: d.question_id,
        student_time: parseFloat((d.student_time / 60).toPrecision(2)),
        course_avg: parseFloat((d.course_avg / 60).toPrecision(2)),
      }));

      if (toMinutes.length === 0) {
        return courseAvg.map((d) => ({
          question_id: d.question_id,
          student_time: 0,
          course_avg: parseFloat((d.avg_time_seconds / 60).toPrecision(2)),
        }));
      }

      return toMinutes;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  }

  public async getLearningObjectiveCompletion(): Promise<LOCData[]> {
    try {
      await connectDB();
      const courseAssignments = await assignments.find({
        course_id: this.adaptID.toString(),
      });

      const rawAlignment = await frameworkQuestionAlignment.find({
        assignment_id: { $in: courseAssignments.map((d) => d.assignment_id) },
      });

      const alignment = rawAlignment.map((d) => ({
        question_id: d.question_id,
        framework_descriptors: d.framework_descriptors,
        framework_levels: d.framework_levels,
      }));

      const uniqueLevelIDs = new Set<string>(
        alignment
          .map((a) => a.framework_levels.map((l: IDWithText) => l.id))
          .flat()
      );

      const frameworkLevelData = await frameworkLevels.find({
        level_id: { $in: Array.from(uniqueLevelIDs) },
      });

      const out: IFrameworkLevel_Raw[] = [];
      for (const a of alignment) {
        // for all levels of alignment, gather all the associated descriptors
        for (const l of a.framework_levels) {
          // Skip if the level is already in the output
          const existing = out.find((o) => o.level_id === l.id);
          if (existing) continue;

          const foundLevel = frameworkLevelData.find(
            (d) => d.level_id.toString() === l.id.toString()
          );
          if (!foundLevel) continue;

          out.push(foundLevel);
        }
      }

      // out is now a list of all levels and each level has its associated descriptors in this alignment
      const final: LOCData[] = [];

      const allQuestionIds = alignment.map((a) => a.question_id);
      const allScores = await this._learningObjectivesGetScoreData(
        allQuestionIds
      );

      for (const o of out) {
        const descriptors = new Set<LOCData["framework_descriptors"][0]>();

        for (const d of o.descriptors) {
          const found = Array.from(descriptors).find(
            (a) => a.id.toString() === d.id.toString()
          );
          if (!found) {
            const descriptorQuestionIds = alignment
              .filter((a) =>
                a.framework_descriptors.find(
                  (l: IDWithText) => l.id.toString() === d.id.toString()
                )
              )
              .map((a) => a.question_id);

            if (descriptorQuestionIds.length === 0) continue; // Skip if no questions are associated with this descriptor

            descriptors.add({
              id: d.id.toString(),
              text: d.descriptor,
              avg_performance: this._learningObjectivesGetAvgScore(
                descriptorQuestionIds,
                allScores
              ),
              questions: descriptorQuestionIds,
              question_count: descriptorQuestionIds.length,
            });
          }
        }

        const levelQuestionIds = alignment
          .filter((a) =>
            a.framework_levels.find(
              (l: IDWithText) => l.id.toString() === o.level_id.toString()
            )
          )
          .map((a) => a.question_id);

        const existing = final.find(
          (f) => f.framework_level.id === o.level_id.toString()
        );
        if (existing) {
          const existingDescriptors = new Set(
            existing.framework_descriptors.map((d) => d.id)
          );
          const newDescriptors = Array.from(descriptors).filter(
            (d) => !existingDescriptors.has(d.id)
          );

          // Add any new descriptors to the existing framework level
          existing.framework_descriptors = Array.from([
            ...existing.framework_descriptors,
            ...newDescriptors,
          ]);
          continue;
        }

        final.push({
          framework_level: {
            id: o.level_id.toString(),
            text: o.title,
            questions: levelQuestionIds,
            question_count: levelQuestionIds.length ?? 0,
            avg_performance: this._learningObjectivesGetAvgScore(
              levelQuestionIds,
              allScores
            ),
          },
          framework_descriptors: Array.from(descriptors),
        });
      }

      // Filter out exclusions
      const frameworkExclusions = await this._getFrameworkExclusions();
      const exclusionIDs = frameworkExclusions.map((d) => d.id);
      const finalFiltered = final.filter((d) => {
        return !exclusionIDs.includes(d.framework_level.id);
      });

      // Sort by framework level
      const sorted = finalFiltered.sort((a, b) => {
        return a.framework_level.text.localeCompare(
          b.framework_level.text,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      });

      return sorted;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private async _getAssignmentExclusions(): Promise<IDWithName[]> {
    try {
      await connectDB();

      const courseSettings = await CourseAnalyticsSettings.findOne({
        courseID: this.adaptID.toString(),
      });

      return courseSettings?.assignmentExclusions ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private async _getFrameworkExclusions(): Promise<IDWithText[]> {
    try {
      await connectDB();

      const courseSettings = await CourseAnalyticsSettings.findOne({
        courseID: this.adaptID.toString(),
      });

      return courseSettings?.frameworkExclusions ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private async _learningObjectivesGetScoreData(question_ids: string[]) {
    try {
      const data = (await assignmentScores.find({
        course_id: this.adaptID.toString(),
        "questions.question_id": { $in: question_ids },
      })) as IAssignmentScoresRaw[];

      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private _learningObjectivesParseScoreData(
    data: IAssignmentScoresRaw[]
  ): { question_id: string; score: number; max_score: number }[] {
    const results = [];
    for (const d of data) {
      for (const q of d.questions) {
        if (!q.score || q.score === "-") continue;
        results.push({
          question_id: q.question_id,
          score: parseFloat(q.score),
          max_score: parseFloat(q.max_score),
        });
      }
    }

    return results;
  }

  private _learningObjectivesGetAvgScore(
    question_ids: string[],
    scoreData: IAssignmentScoresRaw[]
  ) {
    if (question_ids.length === 0) return 0;
    const parsed = this._learningObjectivesParseScoreData(scoreData);
    const questionScores = parsed.filter(
      (s) => s && question_ids.includes(s.question_id)
    );
    if (questionScores.length === 0) return 0;

    // each question has a max_score and the score the student received. for each question, calculate the percentage. then, average all the percentages
    const avg = questionScores.reduce((acc, curr) => {
      if (!curr) return acc;
      return acc + (curr.score / curr.max_score) * 100;
    }, 0);

    return parseFloat((avg / questionScores.length).toPrecision(2));
  }
}

export default Analytics;
