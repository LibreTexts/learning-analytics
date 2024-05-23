"use client";
import SmallMetricCard from "./SmallMetricCard";
import { InstructorQuickMetrics as InstructorQuickMetricsType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { getInstructorQuickMetrics } from "@/lib/analytics-functions";

const InstructorQuickMetrics = ({ course_id }: { course_id: string }) => {
  const { data, status } = useQuery<InstructorQuickMetricsType>({
    queryKey: ["instructor-quick-metrics", course_id],
    queryFn: async () => await getInstructorQuickMetrics(course_id),
  });

  return (
    <div className="tw-flex tw-flex-row tw-justify-between">
      <SmallMetricCard
        title="Assignments"
        value={data?.assignments}
        unit="Active Assignments"
        loading={status === "pending"}
      />
      <SmallMetricCard
        title="Total Page Views"
        value={1225}
        unit="Textbook Total Page Views"
        className="tw-ml-4"
        loading={status === "pending"}
      />
      <SmallMetricCard
        title="Enrolled Students"
        value={data?.enrolled}
        unit="Active Students in Course"
        className="tw-ml-4"
        loading={status === "pending"}
      />
    </div>
  );
};

export default InstructorQuickMetrics;
