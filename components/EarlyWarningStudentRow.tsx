"use client";
import { EWSResult } from "@/lib/types";
import { ewsStatusHeader } from "@/utils/ews-helpers";
import { truncateString } from "@/utils/text-helpers";
import { Card } from "react-bootstrap";
import {
  CheckCircleFill,
  DashCircle,
  DashCircleFill,
  ExclamationCircleFill,
} from "react-bootstrap-icons";

interface EarlyWarningStudentRowProps {
  data: EWSResult;
}

const Metric = ({
  value,
  unit,
  percent,
  absolute = false,
  color,
}: {
  value: string | number;
  unit: string;
  percent: boolean;
  absolute?: boolean;
  color?: "red" | "dark-red" | "black";
}) => {
  const textColorClass =
    color === "red"
      ? "tw-text-red-500"
      : color === "dark-red"
      ? "tw-text-red-700"
      : "tw-text-black";

  return (
    <div className="tw-rounded-md tw-border tw-border-slate-300 tw-border-solid tw-w-52 xl:tw-w-72 tw-p-1 xl:tw-p-2 tw-shadow-sm">
      <p
        className={`tw-text-4xl xl:tw-text-5xl tw-font-semibold tw-text-center ${textColorClass}`}
      >
        {!value
          ? 0
          : typeof value === "string"
          ? value
          : new Intl.NumberFormat("en-US", {
              style: "decimal",
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }).format(absolute ? Math.abs(value) : value)}
        {percent && "%"}
      </p>
      <p className={`tw-mb-0 tw-font-semibold tw-text-center`}>{unit}</p>
    </div>
  );
};

const EarlyWarningStudentRow: React.FC<EarlyWarningStudentRowProps> = ({
  data,
}) => {
  const direction = data.course_avg_diff > 0 ? "Above" : "Below";

  const ewsStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case "success":
        return <CheckCircleFill size={18} color="green" />;
      case "danger":
        return <ExclamationCircleFill size={18} color="red" />;
      case "warning":
        return <DashCircleFill size={18} color="orange" />;
      case "insufficient-data":
        return <DashCircle size={18} color="gray" />;
      default:
        return <DashCircle />;
    }
  };

  return (
    <Card className="tw-my-4 tw-shadow-sm">
      <Card.Body>
        <Card.Title className="tw-font-semibold tw-text-2xl tw-flex tw-flex-row tw-justify-between">
          <p>{truncateString(data.name, 30)}</p>
          <div className="tw-flex tw-flex-row">
            {ewsStatusIcon(data.status)}
            <p className="tw-ml-1 tw-text-xs tw-text-slate-400">
              {ewsStatusHeader(data.status)}
            </p>
          </div>
        </Card.Title>
        <Card.Body className="!tw-p-0">
          <div className="tw-flex tw-flex-row tw-justify-between tw-items-center !tw-mt-4">
            <Metric
              value={data.estimated_final}
              unit="Predicted Final Score"
              percent={true}
              color={
                data.estimated_final < 50
                  ? "dark-red"
                  : data.estimated_final < 70
                  ? "red"
                  : "black"
              }
            />
            <Metric
              value={data.course_avg_diff}
              unit={`${direction} Class Average`}
              percent={true}
            />
            <Metric value={data.z_score} unit="Z-Score" percent={false} />
          </div>
        </Card.Body>
      </Card.Body>
    </Card>
  );
};

export default EarlyWarningStudentRow;
