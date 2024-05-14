"use server";

import Analytics from "@/lib/Analytics";
import {
  ActivityAccessed,
  IDWithName,
  InstructorQuickMetrics,
  StudentQuickMetrics,
} from "./types";
import { ICourseAnalyticsSettings_Raw } from "./models/courseAnalyticsSettings";

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

export async function getActivityAccessed(student_id: string): Promise<ActivityAccessed>{
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const activityAccessed = await analytics.getADAPTActivity(student_id);

  return activityAccessed;
}

export async function getADAPTPerformance(assignment_id: string) {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const performance = await analytics.getADAPTPerformance(assignment_id);

  return performance;
}

export async function getAssignments() {
  const adaptId = process.env.NEXT_PUBLIC_ADAPT_ID;
  const analytics = new Analytics(adaptId);

  const assignments = await analytics.getAssignments();
  return assignments;
}

export async function getGradeDistribution() {
  const adaptId = process.env.NEXT_PUBLIC_ADAPT_ID;
  const analytics = new Analytics(adaptId);
  const gradeDistribution = await analytics.getGradeDistribution();
  return gradeDistribution;
}

export async function getTextbookEngagement() {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const engagement = await analytics.getTextbookEngagement();

  return engagement;
}

export async function getPerformancePerAssignment(student_id: string) {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const performance = await analytics.getPerformancePerAssignment(student_id);

  return performance;
}

export async function getStudents(
  page: number,
  limit: number,
  privacyMode: boolean
) {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const students = await analytics.getStudents(page, limit, privacyMode);

  return students;
}

export async function getSubmissionTimeline(assignment_id: string) {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const timeline = await analytics.getSubmissionTimeline(assignment_id);

  return timeline;
}

export async function updateCourseAnalyticsSettings(
  newSettings: Partial<ICourseAnalyticsSettings_Raw>
) {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  await analytics.updateCourseAnalyticsSettings(newSettings);
}
