"use server";

/***
 * This file contains server-side functions that are used to fetch data from the Analytics class.
 * They contain minimal logic and are used to fetch data for the client-side components.
 */

import Analytics from "@/lib/Analytics";
import {
  ActivityAccessed,
  IDWithName,
  InstructorQuickMetrics,
  StudentQuickMetrics,
} from "./types";
import { ICourseAnalyticsSettings_Raw } from "./models/courseAnalyticsSettings";

export async function getInstructorQuickMetrics(
  course_id: string
): Promise<InstructorQuickMetrics> {
  const analytics = new Analytics(course_id);

  const promises = [
    analytics.getAssignments(true),
    analytics.countEnrolledStudents(),
    analytics.getTotalQuestionsCount(),
  ];

  const res = await Promise.all(promises);
  const assignments = res[0] as IDWithName[];
  const enrolled = res[1] as number;
  const totalQuestions = res[2] as number;

  return {
    assignments: assignments.length,
    enrolled,
    totalQuestions,
  };
}

export async function getStudentQuickMetrics(
  course_id: string,
  student_id: string
): Promise<StudentQuickMetrics> {
  if (!student_id)
    return {
      assignmentsCount: 0,
      averageScore: 0,
      textbookEngagement: 0,
    };

  const analytics = new Analytics(course_id);

  const promises = [
    analytics.getStudentTextbookEngagement(student_id),
    analytics.getStudentAssignmentsCount(student_id),
    analytics.getStudentAverageScore(student_id),
  ];

  const [textbookResult, assignmentsResult, averageResult] =
    await Promise.allSettled(promises);

  const textbookEngagement =
    textbookResult.status === "fulfilled" ? textbookResult.value : 0;
  const assignmentsCount =
    assignmentsResult.status === "fulfilled" ? assignmentsResult.value : 0;
  const averageScore =
    averageResult.status === "fulfilled" ? averageResult.value : 0;

  return {
    textbookEngagement,
    assignmentsCount,
    averageScore,
  };
}

export async function getActivityAccessed(
  course_id: string,
  student_id: string,
  assignment_id: string
): Promise<ActivityAccessed> {
  const analytics = new Analytics(course_id);

  const activityAccessed = await analytics.getADAPTActivity(
    student_id,
    assignment_id
  );

  return activityAccessed;
}

export async function getADAPTPerformance(
  course_id: string,
  assignment_id: string
) {
  const analytics = new Analytics(course_id);
  const performance = await analytics.getADAPTPerformance(assignment_id);
  return performance;
}

export async function getAssignments(
  course_id: string,
  ignoreExclusions = false
) {
  const analytics = new Analytics(course_id);
  const assignments = await analytics.getAssignments(ignoreExclusions);
  return assignments;
}

export async function getGradeDistribution(course_id: string) {
  const analytics = new Analytics(course_id);
  const gradeDistribution = await analytics.getGradeDistribution();
  return gradeDistribution;
}

export async function getTextbookEngagement(course_id: string) {
  const analytics = new Analytics(course_id);
  const engagement = await analytics.getTextbookEngagement();
  return engagement;
}

export async function getPerformancePerAssignment(
  courseID: string,
  student_id: string
) {
  const analytics = new Analytics(courseID);
  const performance = await analytics.getPerformancePerAssignment(student_id);
  return performance;
}

export async function getStudents(
  course_id: string,
  page: number,
  limit: number,
  privacyMode: boolean
) {
  const analytics = new Analytics(course_id);
  const students = await analytics.getStudents(page, limit, privacyMode);
  return students;
}

export async function getSubmissionTimeline(
  course_id: string,
  assignment_id: string
) {
  const analytics = new Analytics(course_id);
  const timeline = await analytics.getSubmissionTimeline(assignment_id);
  return timeline;
}

export async function getCourseFrameworkData(course_id: string) {
  const analytics = new Analytics(course_id);
  const frameworkData = await analytics.getCourseFrameworkData();
  return frameworkData;
}

export async function getCourseAnalyticsSettings(course_id: string) {
  const analytics = new Analytics(course_id);
  const settings = await analytics.getCourseAnalyticsSettings();
  return settings;
}

export async function updateCourseAnalyticsSettings(
  course_id: string,
  newSettings: Partial<ICourseAnalyticsSettings_Raw>
) {
  const analytics = new Analytics(course_id);
  await analytics.updateCourseAnalyticsSettings(newSettings);
}

export async function getCourseRawData(
  course_id: string,
  privacy_mode: boolean
) {
  const analytics = new Analytics(course_id);
  const rawData = await analytics.getRawData(privacy_mode);
  return rawData;
}

export async function getAssignmentFrameworkData(
  course_id: string,
  assignment_id: string
) {
  const analytics = new Analytics(course_id);
  const frameworkData = await analytics.getAssignmentFrameworkData(
    assignment_id
  );
  return frameworkData;
}

export async function checkFinalGradesReleased(course_id: string) {
  const analytics = new Analytics(course_id);
  const finalGradesReleased = await analytics.checkFinalGradesReleased();
  return finalGradesReleased;
}

export async function getTimeInReview(
  course_id: string,
  student_id: string,
  assignment_id: string
) {
  const analytics = new Analytics(course_id);
  const timeInReview = await analytics.getTimeInReview(
    student_id,
    assignment_id
  );
  return timeInReview;
}

export async function getTimeOnTask(
  course_id: string,
  student_id: string,
  assignment_id: string
) {
  const analytics = new Analytics(course_id);
  const timeOnTask = await analytics.getTimeOnTask(student_id, assignment_id);
  return timeOnTask;
}

export async function getLearningObjectiveCompletion(course_id: string) {
  const analytics = new Analytics(course_id);
  const learningObjectiveCompletion =
    await analytics.getLearningObjectiveCompletion();
  return learningObjectiveCompletion;
}

export async function getLearningCurves(course_id: string) {
  const analytics = new Analytics(course_id);
  return await analytics.getLearningCurves();
}
