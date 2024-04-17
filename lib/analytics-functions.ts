"use server";

import Analytics from "@/lib/Analytics";
import { InstructorQuickMetrics, StudentQuickMetrics } from "./types";

export async function getInstructorQuickMetrics(): Promise<InstructorQuickMetrics> {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const assignments = await analytics.getAssignments();
  const enrolled = await analytics.countEnrolledStudents();
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

  const textbookEngagement = await analytics.getStudentTextbookEngagement(
    student_id
  );
  return {
    textbookEngagement,
  };
}

export async function getAssignments() {
  const adaptId = process.env.NEXT_PUBLIC_ADAPT_ID;
  const analytics = new Analytics(adaptId);

  const assignments = await analytics.getAssignments();

  return assignments;
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

export async function getSubmissionTimeline(assignment_id: string) {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const timeline = await analytics.getSubmissionTimeline(assignment_id);

  return timeline;
}
