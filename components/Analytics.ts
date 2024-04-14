import connectDB from "@/lib/database";
import Adapt, { IAdapt_Raw } from "@/lib/models/adapt";
import AdaptCodes from "@/lib/models/adaptCodes";
import Enrollments from "@/lib/models/enrollments";
import Gradebook from "@/lib/models/gradebook";
import LTAnalytics from "@/lib/models/ltanalytics";
import { AssignmentAvgScoreCalc, SubmissionTimeline } from "@/lib/types";
import { getPaginationOffset } from "@/utils/misc";
import { time } from "console";

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

  public async getAssignments(): Promise<
    { _id: string; assignment_name: string }[]
  > {
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

      return res ?? [];
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

  public async getPerformancePerAssignment(
    emailToCompare?: string
  ): Promise<Map<string, Record<string, number>> | undefined> {
    try {
      if (!emailToCompare) {
        return undefined;
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

      const map = new Map<string, Record<string, number>>();
      classAvg.forEach((d) => {
        map.set(d._id, {
          "Class Average": d.avg_score,
        });
      });

      studentScore.forEach((d) => {
        map.set(d._id, {
          ...map.get(d._id),
          "Student Score": d.avg_score,
        });
      });

      return map;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  public async getTextbookEngagement(): Promise<number[] | undefined> {
    try {
      await connectDB();
      const courseId = await this.getCourseId();
      if (!courseId) {
        throw new Error("Course ID not found");
      }

      console.log("starting aggregation");
      console.time("aggregation");
      const res = await LTAnalytics.aggregate([
        {
          $match: {
            "actor.courseName": courseId.toString(),
            verb: "read",
          },
        },
        {
          $addFields: {
            parsedTimestamp: {
              $toDate: "$object.timestamp",
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
        {
          $addFields: {
            // Remove the percent symbol using $substr and convert to integer using $toInt
            parsedPercent: {
              $toInt: {
                $substr: [
                  "$result.percent",
                  0,
                  {
                    $add: [
                      {
                        $strLenCP: "$result.percent",
                      },
                      -1,
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);
      console.timeEnd("aggregation");
      console.log("aggregation complete");

      // // group by result.percent for every 10% and count the number of occurrences
      // const map = new Map<string, number>();
      // res.forEach((d) => {
      //   const key = Math.floor(d.result.percent / 10) * 10;
      //   map.set(key.toString(), (map.get(key.toString()) ?? 0) + 1);
      // });

      const percentages = res
        .filter((d) => !!d.parsedPercent) // filter out undefined values
        .map((d) => d.parsedPercent ?? 0); // map to an array of percentages; there should be no undefined values but default to 0 as a fallback

      return percentages;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  public async getSubmissionTimeline(
    assignment_id: string
  ): Promise<SubmissionTimeline[] | undefined> {
    try {
      await connectDB();

      const res = await Adapt.aggregate([
        {
          $match: {
            assignment_id
          },
        },
        {
          $addFields: {
            parsedSubmissionTime: {
              $toDate: "$submission_time",
            },
            parsedDue: {
              $toDate: "$due",
            },
          },
        },
        {
          $match: {
            parsedSubmissionTime: {
              $gte: new Date("2022-01-01"),
              $lt: new Date("2022-12-31"),
            },
          },
        },
        {
          $project: {
            id: 1,
            parsedSubmissionTime: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$parsedSubmissionTime",
              },
            },
            parsedDue: 1,
          },
        },
        {
          $group: {
            _id: "$parsedSubmissionTime",
            count: { $sum: 1 },
            parsedDue: {
              $first: "$parsedDue",
            },
          },
        },
      ]);

      res.sort((a, b) => a._id.localeCompare(b._id));

      return res;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  public async getStudents(page = 1, limit = 100): Promise<string[]> {
    try {
      await connectDB();

      const offset = getPaginationOffset(page, limit);

      const res = await Enrollments.find({
        class: this.adaptID,
      })
        .select("email")
        .skip(offset)
        .limit(limit);

      return res.map((d) => d.email);
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}

export default Analytics;
