"use client";
import React, { cloneElement } from "react";
import { Card } from "react-bootstrap";
import { useAtom } from "jotai";
import { globalStateAtom } from "@/state/globalState";
import {
  Download as IconDownload,
  Table as IconTable,
} from "react-bootstrap-icons";

interface VisualizationContainerProps {
  title: string;
  description: string;
  children: React.ReactNode;
  studentMode?: boolean;
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  children,
  studentMode = false,
}) => {
  const [globalState] = useAtom(globalStateAtom);

  const childWithProps = cloneElement(children as React.ReactElement, {
    selectedStudentId: globalState.studentId,
    selectedAssignmentId: globalState.assignmentId,
    studentMode,
  });

  return (
    <Card className="tw-mt-4 tw-rounded-lg tw-shadow-sm tw-px-4 tw-pt-4 tw-pb-2">
      <div className="tw-flex tw-flex-row tw-justify-between">
        <div className="tw-flex tw-flex-col">
          <h3 className="tw-text-2xl tw-font-semibold tw-mb-1">{title}</h3>
          <p className="tw-text-xs tw-text-gray-500">{description}</p>
        </div>
      </div>
      {childWithProps}
      <div className="tw-flex tw-flex-row tw-justify-center tw-items-center tw-mt-1 tw-w-full">
        <div className="tw-flex tw-flex-row tw-basis-2/3 tw-justify-end tw-items-center">
          <p className="tw-text-xs tw-text-slate-500 tw-italic tw-justify-center tw-items-center tw-mt-2">
            Data is updated every 12 hours. Current changes may not be
            reflected.
          </p>
        </div>
        <div className="tw-flex tw-flex-row tw-justify-end tw-basis-1/3">
          <button className="tw-underline tw-rounded-md tw-border tw-border-slate-400">
            <IconDownload />
          </button>
          <button className="tw-underline tw-ml-2 tw-rounded-md tw-border tw-border-slate-400">
            <IconTable />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default VisualizationContainer;
