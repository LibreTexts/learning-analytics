import connectDB from "@/lib/database";
import Adapt, { IAdapt_Raw } from "@/lib/models/adapt";
import AdaptCodes from "@/lib/models/adaptCourses";
import Enrollments from "@/lib/models/enrollments";
import Gradebook from "@/lib/models/gradebook";
import LTAnalytics from "@/lib/models/ltanalytics";
import TextbookInteractionsByDate from "@/lib/models/textbookInteractionsByDate";
import {
  ActivityAccessed,
  AnalyticsRawData,
  ArrayElement,
  AssignmentAvgScoreCalc,
  GradeDistribution,
  IDWithName,
  IDWithText,
  PerformancePerAssignment,
  SubmissionTimeline,
  TextbookInteractionsCount,
  TimeInReview,
} from "@/lib/types";
import { getPaginationOffset } from "@/utils/misc";
import { time } from "console";
import calcADAPTSubmissionsByDate, {
  ICalcADAPTSubmissionsByDate,
  ICalcADAPTSubmissionsByDate_Raw,
} from "./models/calcADAPTSubmissionsByDate";
import { sortStringsWithNumbers } from "@/utils/text-helpers";
import calcTextbookActivityTime from "./models/calcTextbookActivityTime";
import { decryptStudent } from "@/utils/data-helpers";
import CalcADAPTAssignments from "./models/calcADAPTAssignments";
import CalcADAPTActorAvgScore from "./models/calcADAPTActorAvgScore";
import calcADAPTGradeDistribution from "./models/calcADAPTGradeDistribution";
import CourseAnalyticsSettings, {
  ICourseAnalyticsSettings_Raw,
} from "./models/courseAnalyticsSettings";
import CalcADAPTAllAssignments, {
  ICalcADAPTAllAssignments_Raw,
} from "./models/calcADAPTAllAssignments";
import ewsActorSummary from "./models/ewsActorSummary";
import ewsCourseSummary from "./models/ewsCourseSummary";
import adaptCourses from "@/lib/models/adaptCourses";
import calcADAPTAllAssignments from "./models/calcADAPTAllAssignments";
import frameworkQuestionAlignment from "./models/frameworkQuestionAlignment";
import reviewTime, { IReviewTime_Raw } from "./models/reviewTime";
import calcReviewTime from "./models/calcReviewTime";

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
      const res = await calcADAPTAllAssignments.aggregate([
        {
          $match: {
            courseID: this.adaptID.toString(),
          },
        },
        {
          $unwind: {
            path: "$assignments",
          },
        },
        {
          $group: {
            _id: "$assignments.id",
            assignment_name: {
              $first: "$assignments.name",
            },
          },
        },
        {
          $project: {
            _id: 1,
            assignment_name: 1,
          },
        },
      ]);

      // sort the assignments by name
      res.sort((a, b) =>
        a.assignment_name.localeCompare(b.assignment_name, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      return (
        res.map((d) => ({
          id: d._id,
          name: d.assignment_name,
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
        courseID: this.adaptID.toString(),
      });

      return res ?? 0;
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

      const allQuestionData = await reviewTime.find({
        course_id: this.adaptID.toString(),
      });

      const studentData = await reviewTime.find({
        course_id: this.adaptID.toString(),
        actor: student_id,
      });

      if (!allQuestionData) {
        return {
          seen: [],
          unseen: [],
          course_avg_percent_seen: 0,
        };
      }

      const allKnownQuestionsSet = () => {
        const questions = new Set<number>();
        allQuestionData.forEach((d) => {
          d.questions.forEach((q: IReviewTime_Raw["questions"][0]) => {
            questions.add(q.question_id);
          });
        });
        return questions;
      };

      const allKnownQuestions = Array.from(allKnownQuestionsSet());

      // Return all questions if student data is not found
      if (!studentData || studentData.length === 0) {
        return {
          seen: [],
          unseen: allKnownQuestions,
          course_avg_percent_seen: 0,
        };
      }

      const studentQuestionsSet = () => {
        const questions = new Set<number>();
        studentData.forEach((d) => {
          d.questions.forEach((q: IReviewTime_Raw["questions"][0]) => {
            questions.add(q.question_id);
          });
        });
        return questions;
      };

      const studentQuestions = Array.from(studentQuestionsSet());

      const { seen: _seen, unseen: _unseen } = allKnownQuestions.reduce(
        (acc: ActivityAccessed, curr: number) => {
          if (studentQuestions.includes(curr)) {
            acc.seen.push(curr);
          } else {
            acc.unseen.push(curr);
          }
          return acc;
        },
        { seen: [], unseen: [], course_avg_percent_seen: 0 }
      );

      return {
        seen: _seen,
        unseen: _unseen,
        course_avg_percent_seen: 0,
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

      const classAvgPromise = Gradebook.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
          },
        },
        {
          $group: {
            _id: "$assignment_name",
            avg_score: { $avg: "$assignment_percent" },
          },
        },
      ]);

      const studentScorePromise = Gradebook.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
            email: emailToCompare,
          },
        },
        {
          $group: {
            _id: "$assignment_name",
            avg_score: { $avg: "$assignment_percent" },
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
  ): Promise<IDWithName[]> {
    try {
      await connectDB();

      const offset = getPaginationOffset(page, limit);

      const res = await Enrollments.find({
        courseID: this.adaptID.toString(),
      })
        .select("email")
        .skip(offset)
        .limit(limit);

      if (privacyMode) {
        return res.map((d) => ({
          id: d.email,
          name: d.email,
        }));
      }

      return await Promise.all(
        res.map(async (d) => ({
          id: d.email,
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

      // Convert to POJO (_id in subdocuments will cause call stack overflow)
      return {
        framework_descriptors: JSON.parse(
          JSON.stringify(assignmentData.framework_descriptors)
        ),
        framework_levels: JSON.parse(
          JSON.stringify(assignmentData.framework_levels)
        ),
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
}

export default Analytics;
