"use client";
import { EarlyWarningStatus } from "@/lib/types/ews";
import { ewsStatusHeader, ewsStatusMessage } from "@/utils/ews-helpers";
import { Card } from "react-bootstrap";
import {
  CheckCircleFill,
  DashCircle,
  DashCircleFill,
  ExclamationCircleFill,
} from "react-bootstrap-icons";
import EarlyWarningInfo from "./EarlyWarningInfo";

interface EarlyWarningBanner {
  status: EarlyWarningStatus;
}

const EarlyWarningBanner: React.FC<EarlyWarningBanner> = ({ status }) => {
  const ewsStatusIcon = (status: string): JSX.Element => {
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
  };

  return (
    <Card className="tw-shadow-sm tw-mb-4">
      <Card.Body>
        <Card.Title className="tw-flex tw-flex-row tw-justify-between tw-items-center tw-mb-0">
          <p>Quick Look</p>
          <EarlyWarningInfo />
        </Card.Title>
        <Card.Body className="!tw-p-0">
          <>
            <div className="tw-flex tw-flex-row">
              <div className="tw-mr-2 tw-mt-0.5">{ewsStatusIcon(status)}</div>
              <p className="tw-text-4xl tw-font-semibold">
                {ewsStatusHeader(status)}
              </p>
            </div>
            <p className="tw-mb-0 tw-text-xs tw-text-slate-400">
              {ewsStatusMessage(status)}
            </p>
          </>
        </Card.Body>
      </Card.Body>
    </Card>
  );
};

export default EarlyWarningBanner;
