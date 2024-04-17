import LTAnalytics from "./models/ltanalytics";
import TextbookInteractionsByDate from "./models/textbookInteractionsByDate";
import connectDB from "./database";
import { debugADP } from "@/utils/misc";
import ADAPT from "./models/adapt";
import Gradebook from "./models/gradebook";

class AnalyticsDataProcessor {
  constructor() {}

  public async runProcessors() {
    //await this.compressADAPTAssignments();
    //await this.compressADAPTAverageScore();
    //await this.compressADAPTInteractionDays();
    await this.compressADAPTSubmissions();
    //await this.compressTextbookActivityTime();
    //await this.compressTexbookInteractions();
  }

  private async compressADAPTAssignments(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTAssignments]: Starting aggregation...");
      await ADAPT.aggregate(
        [
          {
            $match: {
              assignment_id: {
                $exists: true,
                $ne: "",
              },
            },
          },
          {
            $group: {
              _id: {
                courseID: "$course_id",
                actor: "$anon_student_id",
              },
              assignments: {
                $addToSet: "$assignment_id",
              },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id.courseID",
              actor: "$_id.actor",
              assignments: 1,
              assignments_count: {
                $size: "$assignments",
              },
            },
          },
          {
            $merge: {
              into: "calcADAPTAssignments",
              on: ["actor", "courseID"],
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        { allowDiskUse: true }
      );

      debugADP(`[compressADAPTAssignments]: Finished aggregation.`);

      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT assignments"
      );
      return false;
    }
  }

  private async compressADAPTAverageScore(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTAverageScore]: Starting aggregation...");
      await Gradebook.aggregate([
        {
          $group: {
            _id: {
              courseID: "$class",
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
      ]);

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

  private async compressADAPTInteractionDays(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTInteractionDays]: Reading raw data...");

      await ADAPT.aggregate(
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
      await ADAPT.aggregate([
        {
          $match: {
            submission_time: {
              $exists: true,
              $ne: "",
            },
            due: {
              $exists: true,
              $ne: "",
            }
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
              assignmentID: "$assignment_id",
              date: "$submissionDay",
            },
            submissions: {
              $addToSet: "$id",
            },
            dueDate: {
              $first: "$due",
            }
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id.courseID",
            assignmentID: "$_id.assignmentID",
            date: {
              $toDate: "$_id.date",
            },
            dueDate: {
              $toDate: "$dueDate",
            },
            count: {
              $size: "$submissions",
            },
          },
        },
        {
          $merge: {
            into: "calcADAPTSubmissionsByDate",
            on: ["courseID", "assignmentID", "date"],
            whenMatched: "replace",
            whenNotMatched: "insert",
          },
        },
      ]);

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
      await LTAnalytics.aggregate([
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
      ]);

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

  private async compressTexbookInteractions(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressTextbookInteractions]: Starting aggregation...");
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
      debugADP(`[compressTextbookInteractions]: Finished aggregation.`);

      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing textbook interactions"
      );
      return false;
    }
  }
}

export default AnalyticsDataProcessor;
