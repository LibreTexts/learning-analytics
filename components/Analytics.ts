import connectDB from "@/lib/database";
import Adapt from "@/lib/models/adapt";
import AdaptCodes from "@/lib/models/adaptCodes";
import Enrollments from "@/lib/models/enrollments";
import Gradebook from "@/lib/models/gradebook";
import LTAnalytics from "@/lib/models/ltanalytics";
import { AssignmentAvgScoreCalc } from "@/lib/types";
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

  public async countAssignments(): Promise<number> {
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
          },
        },
      ]);

      return res.length ?? 0;
    } catch (err) {
      console.error(err);
      return 0;
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
}

export default Analytics;
