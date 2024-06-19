import connectDB from "@/lib/database";
import Adapt, { IAdapt_Raw } from "@/lib/models/adapt";
import AdaptCodes from "@/lib/models/adaptCourses";
import Enrollments from "@/lib/models/enrollments";
import Gradebook from "@/lib/models/gradebook";
import LTAnalytics from "@/lib/models/ltanalytics";
import TextbookInteractionsByDate from "@/lib/models/textbookInteractionsByDate";
import {
  ADAPTCourseAssignment,
  ActivityAccessed,
  AnalyticsRawData,
  ArrayElement,
  AssignmentAvgScoreCalc,
  GradeDistribution,
  IDWithName,
  IDWithText,
  PerformancePerAssignment,
  Student,
  SubmissionTimeline,
  TextbookInteractionsCount,
  TimeInReview,
  TimeOnTask,
} from "@/lib/types";
import { getPaginationOffset } from "@/utils/misc";
import { time } from "console";
import calcADAPTSubmissionsByDate, {
  ICalcADAPTSubmissionsByDate,
  ICalcADAPTSubmissionsByDate_Raw,
} from "./models/calcADAPTSubmissionsByDate";
import { sortStringsWithNumbers } from "@/utils/text-helpers";
import calcTextbookActivityTime from "./models/calcTextbookActivityTime";
import { decryptStudent, mmssToSeconds } from "@/utils/data-helpers";
import CalcADAPTAssignments from "./models/calcADAPTAssignments";
import CalcADAPTActorAvgScore from "./models/calcADAPTActorAvgScore";
import calcADAPTGradeDistribution from "./models/calcADAPTGradeDistribution";
import CourseAnalyticsSettings, {
  ICourseAnalyticsSettings_Raw,
} from "./models/courseAnalyticsSettings";
import ewsActorSummary from "./models/ewsActorSummary";
import ewsCourseSummary from "./models/ewsCourseSummary";
import adaptCourses from "@/lib/models/adaptCourses";
import frameworkQuestionAlignment from "./models/frameworkQuestionAlignment";
import reviewTime, { IReviewTime_Raw } from "./models/reviewTime";
import calcReviewTime from "./models/calcReviewTime";
import calcADAPTScores from "./models/calcADAPTScores";
import assignmentSubmissions from "./models/assignmentSubmissions";
import assignments from "./models/assignments";
import calcTimeOnTask from "./models/calcTimeOnTask";
import calcADAPTStudentActivity from "./models/calcADAPTStudentActivity";

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
    //    this.initDatabase();
  }

  // private async initDatabase() {
  //   try {
  //     await connectDB();
  //   } catch (err) {
  //     console.error(err);
  //     throw new Error("Failed to connect to database");
  //   }
  // }

  public async getAssignments(): Promise<IDWithName[]> {
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

      return (
        res.map((d) => ({
          id: d.assignment_id.toString(),
          name: d.name,
        })) ?? []
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

  public async getADAPTActivity(student_id: string): Promise<ActivityAccessed> {
    try {
      await connectDB();

      const allCourseQuestions = await assignments.aggregate([
        {
          $unwind: "$questions",
        },
        {
          $group: {
            _id: "$course_id",
            unique_questions: {
              $addToSet: "$questions",
            },
          },
        },
        {
          $project: {
            course_id: "$_id",
            unique_questions: 1,
            _id: 0,
          },
        },
      ]);

      const COURSE_TOTAL_COUNT =
        allCourseQuestions[0].unique_questions.length ?? 0;

      const allCourse = await calcADAPTStudentActivity
        .find({
          course_id: this.adaptID.toString(),
        })
        .lean();

      const courseAvgPercentSeen =
        allCourse.reduce((acc, curr) => {
          if (!curr.seen || !curr.seen.length) return acc;
          const percentSeen = curr.seen.length / COURSE_TOTAL_COUNT;
          if (isNaN(percentSeen)) {
            return acc;
          }
          return acc + percentSeen;
        }, 0) / allCourse.length;

      const studentCourse = allCourse.find((d) => d.student_id === student_id);

      if (!studentCourse) {
        return {
          seen: [],
          unseen: allCourseQuestions[0].unique_questions ?? [],
          course_avg_percent_seen: courseAvgPercentSeen,
        };
      }

      return {
        seen: studentCourse.seen,
        unseen: studentCourse.unseen,
        course_avg_percent_seen: courseAvgPercentSeen,
      };
    } catch (err) {
      console.error(err);
      return {
        seen: [],
        unseen: [],
        course_avg_percent_seen: 0,
      };
    }
  }

  public async getADAPTPerformance(assignment_id: string): Promise<number[]> {
    try {
      await connectDB();

      const assignment = await Gradebook.findOne({
        assignment_id: assignment_id,
      });

      if (!assignment || !assignment.assignment_name) {
        throw new Error("Assignment not found");
      }

      const res = await Gradebook.aggregate([
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

      const studentScorePromise = assignmentSubmissions.aggregate([
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

      return truncated;
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
  ): Promise<ICalcADAPTSubmissionsByDate_Raw[] | undefined> {
    try {
      await connectDB();

      const res = await calcADAPTSubmissionsByDate.find({
        courseID: this.adaptID.toString(),
        assignmentID: assignment_id,
      });

      res.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Convert to POJO
      return res.map((d) => ({
        courseID: d.courseID,
        assignmentID: d.assignmentID,
        date: d.date,
        dueDate: d.dueDate,
        count: d.count,
      }));
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

      const res = await CalcADAPTAssignments.findOne({
        actor: student_id,
        courseID: this.adaptID.toString(),
      });

      return res?.assignments_count ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async getStudentAverageScore(student_id: string): Promise<number> {
    try {
      await connectDB();

      const res = await CalcADAPTActorAvgScore.findOne({
        actor: student_id,
        courseID: this.adaptID.toString(),
      });

      return res?.avg_score ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  public async updateCourseAnalyticsSettings(
    newSettings: Partial<ICourseAnalyticsSettings_Raw>
  ): Promise<boolean> {
    try {
      await connectDB();

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

      const actorIds = res.map((d) => d.actor_id);

      const avgScores = await CalcADAPTActorAvgScore.find({
        courseID: this.adaptID.toString(),
        actor: { $in: actorIds },
      });

      // Calculate course percentile and quartile
      const allScores = res.map((d) => d.course_percent);
      const sortedScores = allScores.sort((a, b) => a - b);

      const getPercentile = (score: number) =>
        (sortedScores.indexOf(score) / allScores.length) * 100;

      const getQuartile = (score: number) => {
        const quartile = Math.floor(
          (sortedScores.indexOf(score) / allScores.length) * 4
        );
        return quartile === 4 ? 3 : quartile;
      };

      const data = res.map((d) => ({
        actor_id: d.actor_id,
        name: d.actor_id,
        pagesAccessed: 0,
        uniqueInteractionDays: d.interaction_days,
        avgPercentAssignment:
          avgScores.find((a) => a.actor === d.actor_id)?.avg_score ?? 0,
        percentSeen: d.percent_seen,
        coursePercent: d.course_percent,
        // round percentile to two decimal places
        classPercentile:
          Math.round(getPercentile(d.course_percent) * 100) / 100,
        classQuartile: getQuartile(d.course_percent),
      }));

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

      const courseSettings = await CourseAnalyticsSettings.findOne({
        courseID: this.adaptID.toString(),
      });

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

      const filteredDescriptors = assignmentData.framework_descriptors.filter(
        (d: IDWithText<number>) => {
          return (
            courseSettings?.frameworkExclusions?.includes(d.text) === false
          );
        }
      );
      const filteredLevels = assignmentData.framework_levels.filter(
        (d: IDWithText<number>) => {
          return (
            courseSettings?.frameworkExclusions?.includes(d.text) === false
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

  public async getTimeInReviewTime(
    student_id: string,
    assignment_id: string
  ): Promise<TimeInReview[]> {
    try {
      await connectDB();

      const studentRes = await calcReviewTime.find({
        course_id: this.adaptID,
        actor: student_id,
        assignment_id: parseInt(assignment_id),
      });

      const courseRes = await calcReviewTime.find({
        course_id: this.adaptID,
        assignment_id: parseInt(assignment_id),
      });

      const studentData = studentRes.map((d) => ({
        question_id: d.question_id,
        total_review_time: d.total_review_time,
      }));

      // Get the total review time for each question
      const courseData = courseRes.reduce((acc, curr) => {
        // @ts-ignore
        const existing = acc.find((a) => a.question_id === curr.question_id);
        if (existing) {
          existing.total_review_time += curr.total_review_time;
        } else {
          acc.push({
            question_id: curr.question_id,
            total_review_time: curr.total_review_time,
          });
        }
        return acc;
      }, [] as { question_id: number; total_review_time: number }[]);

      // Calculate the average review time for each question
      const courseDataAvg = courseData.map((d: any) => ({
        question_id: d.question_id,
        total_review_time:
          d.total_review_time /
          courseData.filter((c: any) => c.question_id === d.question_id).length,
      }));

      const mapped = studentData.map((d) => ({
        question_id: d.question_id,
        student_time: d.total_review_time,
        course_avg:
          courseDataAvg.find((c: any) => c.question_id === d.question_id)
            ?.total_review_time ?? 0,
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

      const studentData = await assignmentSubmissions.find({
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
        student_time: Math.round(d.student_time / 60),
        course_avg: Math.round(d.course_avg / 60),
      }));

      if (toMinutes.length === 0) {
        return courseAvg.map((d) => ({
          question_id: d.question_id,
          student_time: 0,
          course_avg: Math.round(d.avg_time_seconds / 60),
        }));
      }

      return toMinutes;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  }
}

export default Analytics;
