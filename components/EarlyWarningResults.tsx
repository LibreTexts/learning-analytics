"use client";
import { useGlobalContext } from "@/state/globalContext";
import { useEffect, useMemo, useState } from "react";
import { EWSResult, EarlyWarningStatus } from "@/lib/types";
import EarlyWarningStudentRow from "./EarlyWarningStudentRow";
import EarlyWarningBanner from "./EarlyWarningBanner";
import EarlyWarningCourseMetrics from "./EarlyWarningCourseMetrics";

interface EarlyWarningResultsProps {
  getData: (course_id: string, privacy: boolean) => Promise<EWSResult[]>;
}

const EarlyWarningResults: React.FC<EarlyWarningResultsProps> = ({
  getData,
}) => {
  const [globalState] = useGlobalContext();
  const [data, setData] = useState<EWSResult[]>([]);

  useEffect(() => {
    fetchData();
  }, [globalState.courseID, globalState.ferpaPrivacy]);

  async function fetchData() {
    try {
      if (!globalState.courseID) return;
      const res = await getData(globalState.courseID, globalState.ferpaPrivacy);

      if (!res) return;
      setData(res);
    } catch (err) {
      console.error(err);
    }
  }

  const overallStatus: EarlyWarningStatus = useMemo(() => {
    if (!data.length) return "success";
    const dangerCount = data.filter((student) => student.status === "danger");
    const warningCount = data.filter((student) => student.status === "warning");

    if (dangerCount.length) return "danger";
    if (warningCount.length) return "warning";
    return "success";
  }, [data]);

  return (
    <div className="tw-flex tw-flex-col">
      <EarlyWarningBanner status={overallStatus} />
      <EarlyWarningCourseMetrics
        course_avg={data[0]?.course_avg}
        course_std_dev={data[0]?.course_std_dev}
      />
      {data.length > 0 &&
        data.map((result) => (
          <EarlyWarningStudentRow key={result.name} data={result} />
        ))}
    </div>
  );
};

export default EarlyWarningResults;
