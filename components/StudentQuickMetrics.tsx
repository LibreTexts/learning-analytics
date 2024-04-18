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
    <div className="tw-flex tw-flex-row tw-justify-between">
      <SmallMetricCard
        title="Textbook Engagement"
        value={minutesToPrettyHours(data?.textbookEngagement ?? 0)}
        unit="Total Time Spent"
        loading={status === "pending"}
      />
    </div>
  );
};

export default StudentQuickMetrics;
