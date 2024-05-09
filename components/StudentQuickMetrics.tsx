import { minutesToPrettyHours } from "@/utils/text-helpers";
import SmallMetricCard from "./SmallMetricCard";
import { useQuery } from "@tanstack/react-query";
import { getStudentQuickMetrics } from "@/lib/analytics-functions";
import { StudentQuickMetrics as StudentQuickMetricsType } from "@/lib/types";

const StudentQuickMetrics = ({ studentId }: { studentId: string }) => {
  const { data, status } = useQuery<StudentQuickMetricsType>({
    queryKey: ["student-quick-metrics"],
    queryFn: async () => await getStudentQuickMetrics(studentId),
  });

  return (
    <div className="tw-flex tw-flex-row tw-justify-start">
      <SmallMetricCard
        title="Assignments Completed"
        value={data?.assignmentsCount ?? 0}
        unit="To Date"
        loading={status === "pending"}
      />
      <SmallMetricCard
        title="Average Score"
        value={`${data?.averageScore ?? 0}%`}
        unit="Per Assignment"
        loading={status === "pending"}
        className="tw-ml-36"
      />
    </div>
  );
};

export default StudentQuickMetrics;
