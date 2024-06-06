import LTAnalytics from "./models/ltanalytics";
import TextbookInteractionsByDate from "./models/textbookInteractionsByDate";
import connectDB from "./database";
import { debugADP } from "@/utils/misc";
import ADAPT from "./models/adapt";
import Gradebook from "./models/gradebook";
import useADAPTAxios from "@/hooks/useADAPTAxios";
import { IDWithName } from "./types";
import textbookInteractionsByDate from "./models/textbookInteractionsByDate";
import calcADAPTAllAssignments from "./models/calcADAPTAllAssignments";
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

class AnalyticsDataProcessor {
  constructor() {}

  public async runProcessors() {
    await this.compressADAPTAllAssignments();
    // await this.compressADAPTAssignments();
    // await this.compressADAPTAverageScore();
    // await this.compressADAPTInteractionDays();
    // await this.compressADAPTGradeDistribution();
    // await this.compressADAPTSubmissions();
    // await this.compressADAPTScores();
    // await this.compressTextbookActivityTime();
    // await this.compressTexbookInteractionsByDate();
    // await this.compressTextbookNumInteractions(); // Should be ran after compressing textbookInteractionsByDate
    await this.compressReviewTime();
    // await this.writeEWSCourseSummary();
    // await this.writeEWSActorSummary();
  }

  private async compressADAPTAllAssignments(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTAllAssignments]: Starting aggregation...");
      await Gradebook.aggregate(
        [
          {
            $group: {
              _id: {
                course_id: "$course_id",
                assignment_id: "$assignment_id",
              },
              assignment_name: {
                $first: "$assignment_name",
              },
              assignments: {
                $addToSet: "$assignment_id",
              },
            },
          },
          {
            $group: {
              _id: "$_id.course_id",
              assignments: {
                $addToSet: {
                  id: "$_id.assignment_id",
                  name: "$assignment_name",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id",
              assignments: 1,
            },
          },
          {
            $merge: {
              into: "calcADAPTAllAssignments",
              on: "courseID",
              whenMatched: "replace",
              whenNotMatched: "insert",
            },
          },
        ],
        {
          allowDiskUse: true,
        }
      );

      debugADP(`[compressADAPTAllAssignments]: Finished aggregation.`);
      return true;
    } catch (err: any) {
      debugADP(
        err.message ??
          "Unknown error occured while compressing ADAPT all assignments"
      );
      return false;
    }
  }

  private async compressADAPTAssignments(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTAssignments]: Starting aggregation...");
      await Gradebook.aggregate(
        [
          {
            $match: {
              assignment_id: {
                $exists: true,
                $nin: [null, ""],
              },
            },
          },
          {
            $group: {
              _id: {
                courseID: "$course_id",
                actor: "$email",
              },
              assignments: {
                $addToSet: {
                  assignment_id: {
                    $toString: "$assignment_id",
                  },
                  score: "$assignment_percent",
                },
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
            $match: {
              actor: {
                $exists: true,
                $nin: [null, ""],
              },
              courseID: {
                $exists: true,
                $nin: [null, ""],
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
      await Gradebook.aggregate(
        [
          {
            $group: {
              _id: {
                courseID: "$course_id",
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
        ],
        { allowDiskUse: true }
      );

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

  private async compressADAPTScores(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[compressADAPTScores]: Starting aggregation...");
      await Gradebook.aggregate(
        [
          {
            $match: {
              assignment_id: {
                $exists: true,
                $ne: null,
              },
            },
          },
          {
            $group: {
              _id: {
                courseID: "$course_id",
                assignmentID: "$assignment_id",
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
              assignmentID: {
                $toString: "$_id.assignmentID",
              },
              scores: 1,
            },
          },
          {
            $merge: {
              into: "calcADAPTScores",
              on: ["courseID", "assignmentID"],
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

  private async compressADAPTGradeDistribution(): Promise<boolean> {
    try {
      await connectDB();

      await Gradebook.aggregate(
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
      await ADAPT.aggregate(
        [
          {
            $match: {
              submission_time: {
                $exists: true,
                $ne: "",
              },
              due: {
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
                assignmentID: "$assignment_id",
                date: "$submissionDay",
              },
              submissions: {
                $addToSet: "$id",
              },
              dueDate: {
                $first: "$due",
              },
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
              actor: "$actor",
              assignment_id: "$assignment_id",
              course_id: "$course_id",
            },
            questions: {
              $push: "$questions",
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor: "$_id.actor",
            assignment_id: "$_id.assignment_id",
            course_id: "$_id.course_id",
            questions: {
              $arrayElemAt: ["$questions", 0],
            },
          },
        },
      ]);

      debugADP("[compressReviewTime]: Finished aggregation.");
      return true;
    } catch (err: any) {
      debugADP(
        err.message ?? "Unknown error occured while compressing review time"
      );
      return false;
    }
  }

  private async writeEWSCourseSummary(): Promise<boolean> {
    try {
      await connectDB();

      debugADP("[writeEWSCourseSummary]: Starting aggregation...");
      const coursesWAssignments = await calcADAPTAllAssignments.find();
      const courseAssignmentMap = new Map<string, string[]>();
      coursesWAssignments.forEach((course) => {
        course.assignments.forEach((assignment: IDWithName) => {
          if (courseAssignmentMap.has(course.courseID)) {
            courseAssignmentMap.get(course.courseID)?.push(assignment.id);
          } else {
            courseAssignmentMap.set(course.courseID, [assignment.id]);
          }
        });
      });

      // for each course + assignment, find the scores from calcADAPTScores collection and calculate the average score
      const aggScores = await calcADAPTScores.aggregate(
        [
          {
            $match: {
              $or: Array.from(courseAssignmentMap.entries()).map(
                ([courseID, assignmentIDs]) => ({
                  courseID: courseID,
                  assignmentID: { $in: assignmentIDs },
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
                courseID: "$courseID",
                assignmentID: "$assignmentID",
              },
              averageScore: { $avg: "$scores" },
            },
          },
          {
            $project: {
              _id: 0,
              courseID: "$_id.courseID",
              assignmentID: "$_id.assignmentID",
              averageScore: 1,
            },
          },
        ],
        { allowDiskUse: true }
      );

      const calculateAvgCoursePercent = (scores: any[]) => {
        // filter out null, undefined and NaN values
        scores = scores.filter((score) => score.averageScore);
        const sum = scores.reduce(
          (acc: number, score: { averageScore: number }) =>
            acc + score.averageScore,
          0
        );
        return sum / scores.length || 0;
      };

      const courseSummaries: IEWSCourseSummary_Raw[] = [];
      for (const [courseID, assignmentIDs] of Array.from(
        courseAssignmentMap.entries()
      )) {
        const courseScores = aggScores.filter(
          (score: { courseID: string; assignmentID: string }) =>
            score.courseID === courseID &&
            assignmentIDs.includes(score.assignmentID)
        );

        const courseSummary: IEWSCourseSummary_Raw = {
          course_id: courseID,
          assignments: courseScores.map(
            (score: { assignmentID: string; averageScore: number }) => ({
              assignment_id: score.assignmentID,
              avg_score: score.averageScore,
            })
          ),
          avg_course_percent: calculateAvgCoursePercent(courseScores),
          avg_interaction_days: 0,
          avg_percent_seen: 0,
          last_updated: new Date(),
          status: "insufficient-data", // set this for now, we will update with updateCourseSummaryStatus below
        };

        courseSummaries.push(courseSummary);
      }

      const interactionDays = await calcADAPTInteractionDays.aggregate([
        {
          $group: {
            _id: "$courseID",
            avg_interaction_days: {
              $avg: {
                $size: "$days",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id",
            avg_interaction_days: 1,
          },
        },
      ]);

      interactionDays.forEach((course) => {
        const courseSummary = courseSummaries.find(
          (summary) => summary.course_id === course.courseID
        );
        if (courseSummary) {
          courseSummary.avg_interaction_days = course.avg_interaction_days;
        }
      });

      /* for percent seen, from calcADAPTAllAssignments, we can get the number of assignments for each course
      and from calcADAPTAssignments, we can get the number of assignments completed by each student in each course.
      Then, we can calculate the average percent seen for each course. */

      const courseAssignments = await calcADAPTAllAssignments.find();
      const courseAssignmentsMap = new Map<string, number>();
      courseAssignments.forEach((course) => {
        courseAssignmentsMap.set(course.courseID, course.assignments.length);
      });

      const courseAssignmentsCompleted = await calcADAPTAssignments.aggregate([
        {
          $group: {
            _id: "$courseID",
            avg_percent_seen: { $avg: "$assignments_count" },
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id",
            avg_percent_seen: 1,
          },
        },
      ]);

      courseAssignmentsCompleted.forEach((course) => {
        const courseSummary = courseSummaries.find(
          (summary) => summary.course_id === course.courseID
        );
        if (courseSummary) {
          courseSummary.avg_percent_seen = course.avg_percent_seen;
        }
      });

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
          $group: {
            _id: {
              email: "$email",
              courseID: "$courseID",
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor_id: "$_id.email",
            course_id: "$_id.courseID",
          },
        },
      ]);

      const actorWCourses = new Map<string, string[]>();
      actors.forEach((actor) => {
        if (actorWCourses.has(actor.actor_id)) {
          actorWCourses.get(actor.actor_id)?.push(actor.course_id);
        } else {
          actorWCourses.set(actor.actor_id, [actor.course_id]);
        }
      });

      const actorAssignments = await calcADAPTAssignments.aggregate(
        [
          {
            $match: {
              $or: Array.from(actorWCourses.entries()).map(
                ([actorID, courseIDs]) => ({
                  actor: actorID,
                  courseID: { $in: courseIDs },
                })
              ),
            },
          },
        ],
        {
          allowDiskUse: true,
        }
      );

      const actorSummaries: IEWSActorSummary_Raw[] = [];
      const assignmentsByActorIdCourseId = new Map<string, any[]>();
      for (const [actorID, courseIDs] of Array.from(actorWCourses.entries())) {
        for (const courseID of courseIDs) {
          const actorCourseAssignments = actorAssignments.filter(
            (assignment: { actor: string; courseID: string }) =>
              assignment.actor === actorID && assignment.courseID === courseID
          );

          const actorSummary: IEWSActorSummary_Raw = {
            actor_id: actorID,
            course_id: courseID,
            percent_seen: 0,
            interaction_days: 0,
            course_percent: 0,
          };
          assignmentsByActorIdCourseId.set(
            `${actorID}:${courseID}`,
            actorCourseAssignments
              .at(0)
              ?.assignments.map(
                (assignment: { assignment_id: string; score: number }) => ({
                  assignment_id: assignment.assignment_id,
                  score: isNaN(assignment.score) ? 0 : assignment.score,
                })
              ) || []
          );

          actorSummaries.push(actorSummary);
        }
      }

      const interactionDays = await calcADAPTInteractionDays.aggregate([
        {
          $group: {
            _id: {
              actor: "$actor",
              courseID: "$courseID",
            },
            interaction_days: {
              $sum: {
                $size: "$days",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor_id: "$_id.actor",
            course_id: "$_id.courseID",
            interaction_days: 1,
          },
        },
      ]);

      interactionDays.forEach((interaction) => {
        const actorSummary = actorSummaries.find(
          (summary) =>
            summary.actor_id === interaction.actor_id &&
            summary.course_id === interaction.course_id
        );
        if (actorSummary) {
          actorSummary.interaction_days = interaction.interaction_days;
        }
      });

      const courseAssignments = await calcADAPTAllAssignments.aggregate([
        {
          $group: {
            _id: "$courseID",
            assignments_count: {
              $sum: {
                $size: "$assignments",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            courseID: "$_id",
            assignments_count: 1,
          },
        },
      ]);

      const courseAssignmentsMap = new Map<string, number>();
      courseAssignments.forEach((course) => {
        courseAssignmentsMap.set(course.courseID, course.assignments_count);
      });

      actorSummaries.forEach((actorSummary) => {
        const courseID = actorSummary.course_id;
        const assignmentsCount = courseAssignmentsMap.get(courseID) ?? 0;
        const foundAssignments = assignmentsByActorIdCourseId.get(
          `${actorSummary.actor_id}:${courseID}`
        );
        actorSummary.percent_seen =
          ((foundAssignments?.length ?? 0) / assignmentsCount) * 100 || 0;
      });

      // For course_percent, find the latest gradebook entry for each actor in each course and use the overall_course_percent
      const latestGradebookEntries = await Gradebook.aggregate([
        {
          $group: {
            _id: {
              actor: "$email",
              courseID: "$course_id",
            },
            newestDocument: {
              $last: "$$ROOT",
            },
          },
        },
        {
          $project: {
            _id: 0,
            actor_id: "$_id.actor",
            course_id: "$_id.courseID",
            course_percent: "$newestDocument.overall_course_percent",
          },
        },
      ]);

      latestGradebookEntries.forEach((entry) => {
        const actorSummary = actorSummaries.find(
          (summary) =>
            summary.actor_id === entry.actor_id &&
            summary.course_id === entry.course_id
        );
        if (actorSummary) {
          actorSummary.course_percent = entry.course_percent;
        }
      });

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
}

export default AnalyticsDataProcessor;
