"use client";
import { Card } from "react-bootstrap";
import {
  CheckCircleFill,
  DashCircle,
  DashCircleFill,
  ExclamationCircleFill,
} from "react-bootstrap-icons";

interface EarlyWarningBanner {
  variant: "success" | "danger" | "warning" | "insufficient-data";
}

const EarlyWarningBanner: React.FC<EarlyWarningBanner> = ({ variant }) => {
  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircleFill size={36} color="green" />;
      case "danger":
        return <ExclamationCircleFill size={36} color="red" />;
      case "warning":
        return <DashCircleFill size={36} color="yellow" />;
      case "insufficient-data":
        return <DashCircle size={36} color="gray" />;
      default:
        return <DashCircle />;
    }
  };

  const getHeader = () => {
    switch (variant) {
      case "success":
        return "Looks Good";
      case "danger":
        return "Attention Needed";
      case "warning":
        return "Warning";
      case "insufficient-data":
        return "Insufficient Data";
      default:
        return "Unknown";
    }
  };

  const getMessage = () => {
    switch (variant) {
      case "success":
        return "No students were identified as 'at-risk'. Keep up the good work!";
      case "danger":
        return "We have identified a number of students in need of intervention.";
      case "warning":
        return "We have identified a few students as 'at-risk'. Intervention may be needed soon.";
      case "insufficient-data":
        return "Sorry, we don't have enough data to make performance predictions. Performance predictions improve with more student enrollments and assignment data.";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="tw-shadow-sm">
      <Card.Body>
        <Card.Title>Quick Look</Card.Title>
        <Card.Body className="!tw-p-0">
          <>
            <div className="tw-flex tw-flex-row tw-mt-4">
              <div className="tw-mr-4 tw-mt-0.5">{getIcon()}</div>
              <p className="tw-text-4xl tw-font-semibold">{getHeader()}</p>
            </div>
            <p className="tw-mb-0 tw-text-xs tw-text-slate-400">
              {getMessage()}
            </p>
          </>
        </Card.Body>
      </Card.Body>
    </Card>
  );
};

export default EarlyWarningBanner;
