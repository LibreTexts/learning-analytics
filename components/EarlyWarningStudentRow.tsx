"use client"
import { capitalizeFirstLetter } from "@/utils/text-helpers";
import { Card } from "react-bootstrap";

interface EarlyWarningStudentRowProps {
  email: string;
  courseAverageDiff: string;
  courseAverageDirection: "above" | "below";
  estimatedFinalGrade: string;
  likelihood: string;
}

const Metric = ({ value, unit }: { value: string | number; unit: string }) => {
  return (
    <div className="tw-rounded-md tw-border tw-border-slate-400 tw-border-solid tw-w-72 tw-p-2">
      <p className="tw-text-6xl tw-font-semibold tw-text-center">
        {!value
          ? 0
          : typeof value === "string"
          ? value
          : new Intl.NumberFormat().format(value)}
      </p>
      <p className="tw-mb-0 tw-font-semibold tw-text-center">{unit}</p>
    </div>
  );
};

const EarlyWarningStudentRow: React.FC<EarlyWarningStudentRowProps> = ({
  email,
  courseAverageDiff,
  courseAverageDirection,
  estimatedFinalGrade,
  likelihood,
}) => {
  return (
    <Card className="tw-my-4 tw-shadow-sm">
      <Card.Body>
        <Card.Title className="tw-font-semibold tw-text-2xl">{email}</Card.Title>
        <Card.Body className="!tw-p-0">
          <div className="tw-flex tw-flex-row tw-justify-between tw-items-center">
            <Metric
              value={courseAverageDiff}
              unit={`${capitalizeFirstLetter(
                courseAverageDirection
              )} Class Average`}
            />
            <Metric value={estimatedFinalGrade} unit="Estimated Final Grade" />
            <Metric value={likelihood} unit="Likelihood of Passing" />
          </div>
        </Card.Body>
      </Card.Body>
    </Card>
  );
};

export default EarlyWarningStudentRow;
