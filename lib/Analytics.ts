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
  IDWithName,
  PerformancePerAssignment,
  SubmissionTimeline,
  TextbookInteractionsCount,
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
      const res = await Adapt.aggregate([
        {
          $match: {
            course_id: this.adaptID.toString(),
          },
        },
        {
          $group: {
            _id: "$assignment_id",
            assignment_name: {
              $first: "$assignment_name",
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
      res.sort((a, b) => a.assignment_name.localeCompare(b.assignment_name));

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

      const allAssignmentData = await CalcADAPTAllAssignments.findOne({
        courseID: this.adaptID.toString(),
      });

      const studentAssignmentData = await CalcADAPTAssignments.findOne({
        actor: student_id,
        courseID: this.adaptID.toString(),
      });

      const courseAvgPercent = await ewsCourseSummary
        .findOne({
          course_id: this.adaptID.toString(),
        })
        .select("avg_percent_seen");

      if (!allAssignmentData) {
        throw new Error("Assignment data not found");
      }

      const allFoundAssignments = allAssignmentData?.assignments ?? [];
      const allStudentAssignments = studentAssignmentData?.assignments ?? [];

      if (!allStudentAssignments || allStudentAssignments.length === 0) {
        return {
          seen: [],
          unseen: allFoundAssignments.map((a: any) => ({
            id: a.id,
            name: a.name,
          })),
          course_avg_percent_seen: courseAvgPercent?.avg_percent_seen ?? 0,
        };
      }

      const { seen, unseen } = allFoundAssignments.reduce(
        (acc: ActivityAccessed, curr: IDWithName) => {
          const obj = { id: curr.id, name: curr.name };
          //const found = studentAssignmentData.assignments.find((d) => d === curr.id);
          if (studentAssignmentData.assignments.includes(curr.id)) {
            acc.seen.push(obj);
          } else {
            acc.unseen.push(obj);
          }
          return acc;
        },
        { seen: [], unseen: [] }
      );

      return {
        seen: seen.map((d: any) => ({
          id: d.id,
          name: d.name,
        })),
        unseen: unseen.map((d: any) => ({
          id: d.id,
          name: d.name,
        })),
        course_avg_percent_seen: courseAvgPercent?.avg_percent_seen ?? 0,
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

      const assignment = await Adapt.findOne({
        assignment_id: assignment_id,
      });

      if (!assignment || !assignment.assignment_name) {
        throw new Error("Assignment not found");
      }

      const res = await Gradebook.aggregate([
        {
          $match: {
            class: this.adaptID.toString(),
            level_name: assignment.assignment_name,
          },
        },
        {
          $group: {
            _id: "$level_name",
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

  public async getGradeDistribution(): Promise<string[]> {
    try {
      const res = await calcADAPTGradeDistribution.find({
        courseID: this.adaptID.toString(),
      });

      const grades = (res[0].grades as string[]) || [];
      return grades;
    } catch (err) {
      console.error(err);
      return [];
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
            class: this.adaptID.toString(),
          },
        },
        {
          $group: {
            _id: "$level_name",
            avg_score: { $avg: "$assignment_percent" },
          },
        },
      ]);

      const studentScorePromise = Gradebook.aggregate([
        {
          $match: {
            class: this.adaptID.toString(),
            email: emailToCompare,
          },
        },
        {
          $group: {
            _id: "$level_name",
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

      return res;
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
}

export default Analytics;
