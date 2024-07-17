"use client";
import { useGlobalContext } from "@/state/globalContext";
import { useMemo } from "react";
import { EWSResult, EarlyWarningStatus } from "@/lib/types";
import EarlyWarningStudentRow from "./EarlyWarningStudentRow";
import EarlyWarningBanner from "./EarlyWarningBanner";
import EarlyWarningCourseMetrics from "./EarlyWarningCourseMetrics";
import { useQuery } from "@tanstack/react-query";
import LoadingComponent from "./LoadingComponent";

interface EarlyWarningResultsProps {
  getData: (course_id: string, privacy: boolean) => Promise<EWSResult[]>;
}

const EarlyWarningResults: React.FC<EarlyWarningResultsProps> = ({
  getData,
}) => {
  const [globalState] = useGlobalContext();
  const { data, isFetching } = useQuery<EWSResult[]>({
    queryKey: ["ews", globalState.courseID, globalState.ferpaPrivacy],
    queryFn: () => getData(globalState.courseID, globalState.ferpaPrivacy),
    enabled: !!globalState.courseID,
    refetchOnMount: false,
  });

  const overallStatus: EarlyWarningStatus = useMemo(() => {
    if (!data?.length) return "success";
    const dangerCount = data.filter((student) => student.status === "danger");
    const warningCount = data.filter((student) => student.status === "warning");

    if (dangerCount.length) return "danger";
    if (warningCount.length) return "warning";
    return "success";
  }, [data]);

  return (
    <div className="tw-flex tw-flex-col">
      {isFetching && <LoadingComponent />}
      {!isFetching && (
        <>
          <EarlyWarningBanner status={overallStatus} />
          {data && data.length > 0 && (
            <EarlyWarningCourseMetrics
              course_avg={data[0]?.course_avg}
              course_std_dev={data[0]?.course_std_dev}
            />
          )}
          {data &&
            data.length > 0 &&
            data.map((result) => (
              <EarlyWarningStudentRow key={result.name} data={result} />
            ))}
        </>
      )}
    </div>
  );
};

export default EarlyWarningResults;
