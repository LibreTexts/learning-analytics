"use server";

import Analytics from "@/lib/Analytics";
import {
  ActivityAccessed,
  IDWithName,
  InstructorQuickMetrics,
  StudentQuickMetrics,
} from "./types";
import { ICourseAnalyticsSettings_Raw } from "./models/courseAnalyticsSettings";
import { validateRequest } from "./auth";

export async function getInstructorQuickMetrics(): Promise<InstructorQuickMetrics> {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const promises = [
    analytics.getAssignments(),
    analytics.countEnrolledStudents(),
  ];

  const res = await Promise.all(promises);
  const assignments = res[0] as IDWithName[];
  const enrolled = res[1] as number;

  return {
    assignments: assignments.length,
    enrolled,
  };
}

export async function getStudentQuickMetrics(
  student_id: string
): Promise<StudentQuickMetrics> {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const promises = [
    analytics.getStudentTextbookEngagement(student_id),
    analytics.getStudentAssignmentsCount(student_id),
    analytics.getStudentAverageScore(student_id),
  ];

  const [textbookEngagement, assignmentsCount, averageScore] =
    await Promise.all(promises);

  return {
    textbookEngagement,
    assignmentsCount,
    averageScore,
  };
}

export async function getActivityAccessed(
  course_id: string,
  student_id: string
): Promise<ActivityAccessed> {
  const analytics = new Analytics(course_id);

  const activityAccessed = await analytics.getADAPTActivity(student_id);

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

export async function getAssignments(course_id: string) {
  const analytics = new Analytics(course_id);
  const assignments = await analytics.getAssignments();
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

export async function updateCourseAnalyticsSettings(
  course_id: string,
  newSettings: Partial<ICourseAnalyticsSettings_Raw>
) {
  const analytics = new Analytics(course_id);
  await analytics.updateCourseAnalyticsSettings(newSettings);
}

export async function getCourseRawData(course_id: string, privacy_mode: boolean) {
  const analytics = new Analytics(course_id);
  const rawData = await analytics.getRawData(privacy_mode);
  return rawData;
}
