import connectDB from "@/lib/database";
import Adapt, { IAdapt_Raw } from "@/lib/models/adapt";
import AdaptCodes from "@/lib/models/adaptCodes";
import Enrollments from "@/lib/models/enrollments";
import Gradebook from "@/lib/models/gradebook";
import LTAnalytics from "@/lib/models/ltanalytics";
import TextbookInteractionsByDate from "@/lib/models/textbookInteractionsByDate";
import {
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
import CalcADAPTAverageScore from "./models/calcADAPTAverageScore";
import calcADAPTGradeDistribution from "./models/calcADAPTGradeDistribution";
import CourseAnalyticsSettings, {
  ICourseAnalyticsSettings_Raw,
} from "./models/courseAnalyticsSettings";

class Analytics {
  private adaptID: number;
  constructor(_adaptID?: string) {
    if (!_adaptID) {
      throw new Error("ADAPT ID is required");
    }
    const parsed = parseInt(_adaptID.trim());
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
        class: this.adaptID,
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

  public async getADAPTPerformance(assignment_id: string): Promise<number[]> {
    try {
      await connectDB();

      console.log("Assignment ID: ", assignment_id);

      const assignment = await Adapt.findOne({
        assignment_id: assignment_id,
      });

      if (!assignment || !assignment.assignment_name) {
        throw new Error("Assignment not found");
      }

      console.log("found assignment: ", assignment.assignment_name);

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
        class: this.adaptID,
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

      const res = await CalcADAPTAverageScore.findOne({
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
}

export default Analytics;
