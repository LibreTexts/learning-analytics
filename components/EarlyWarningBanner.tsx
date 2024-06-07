"use client";
import { EarlyWarningStatus } from "@/lib/types/ews";
import { useGlobalContext } from "@/state/globalContext";
import { useEffect, useMemo, useState } from "react";
import { Card } from "react-bootstrap";
import {
  CheckCircleFill,
  DashCircle,
  DashCircleFill,
  ExclamationCircleFill,
} from "react-bootstrap-icons";

interface EarlyWarningBanner {
  getStatus: (course_id: string) => Promise<EarlyWarningStatus>;
}

const EarlyWarningBanner: React.FC<EarlyWarningBanner> = ({ getStatus }) => {
  const [globalState] = useGlobalContext();
  const [status, setStatus] = useState<EarlyWarningStatus>("insufficient-data");

  useEffect(() => {
    if(!globalState.courseID) return;
    //getStatus(globalState.courseID).then((status) => setStatus(status));
    setStatus("warning")
  }, [globalState.courseID]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case "success":
        return <CheckCircleFill size={36} color="green" />;
      case "danger":
        return <ExclamationCircleFill size={36} color="red" />;
      case "warning":
        return <DashCircleFill size={36} color="orange" />;  
      case "insufficient-data":
        return <DashCircle size={36} color="gray" />;
      default:
        return <DashCircle />;
    }
  }, [status]);

  const statusHeader = useMemo(() => {
    switch (status) {
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
  }, [status]);

  const statusMessage = useMemo(() => {
    switch (status) {
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
  }, [status]);

  return (
    <Card className="tw-shadow-sm tw-mb-4">
      <Card.Body>
        <Card.Title>Quick Look</Card.Title>
        <Card.Body className="!tw-p-0">
          <>
            <div className="tw-flex tw-flex-row tw-mt-4">
              <div className="tw-mr-4 tw-mt-0.5">{statusIcon}</div>
              <p className="tw-text-4xl tw-font-semibold">{statusHeader}</p>
            </div>
            <p className="tw-mb-0 tw-text-xs tw-text-slate-400">
              {statusMessage}
            </p>
          </>
        </Card.Body>
      </Card.Body>
    </Card>
  );
};

export default EarlyWarningBanner;
