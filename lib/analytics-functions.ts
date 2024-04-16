"use server";

import Analytics from "@/components/Analytics";

export async function getData() {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env
  const analytics = new Analytics(adapt_id);

  const assignments = await analytics.getAssignments();
  const enrolled = await analytics.countEnrolledStudents();
  return {
    assignments: assignments.length,
    enrolled,
  };
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
