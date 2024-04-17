import { getInstructorQuickMetrics } from "@/lib/analytics-functions";
import SmallMetricCard from "./SmallMetricCard";
import { useEffect, useState } from "react";
import { InstructorQuickMetrics as InstructorQuickMetricsType } from "@/lib/types";

const InstructorQuickMetrics = () => {
  const [data, setData] = useState<InstructorQuickMetricsType>({
    assignments: 0,
    enrolled: 0,
  });

  useEffect(() => {
    getInstructorQuickMetrics().then(setData);
  }, []);

  return (
    <div className="tw-flex tw-flex-row tw-justify-between">
      <SmallMetricCard
        title="Assignments"
        value={data.assignments}
        unit="Active Assignments"
      />
      <SmallMetricCard
        title="Total Page Views"
        value={1225}
        unit="Textbook Total Page Views"
        className="tw-ml-4"
      />
      <SmallMetricCard
        title="Enrolled Students"
        value={data.enrolled}
        unit="Active Students in Course"
        className="tw-ml-4"
      />
    </div>
  );
};

export default InstructorQuickMetrics;
