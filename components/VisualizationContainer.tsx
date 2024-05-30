"use client";
import React, { cloneElement, useEffect, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import {
  Download as IconDownload,
  Table as IconTable,
  BarChart as IconBarChart,
} from "react-bootstrap-icons";
import { VisualizationInnerRef } from "@/lib/types";
import { useGlobalContext } from "@/state/globalContext";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "@/utils/visualization-helpers";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<VisualizationInnerRef | null>(null);
  const [tableView, setTableView] = useState(false);
  const [globalState] = useGlobalContext();
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width ?? DEFAULT_WIDTH);
        setHeight(entry.contentRect.height ?? DEFAULT_HEIGHT);
      }
    });
    observer.observe(containerRef.current as Element);
  }, [containerRef.current]);

  const childWithProps = cloneElement(children as React.ReactElement, {
    selectedStudentId: globalState.studentId,
    selectedAssignmentId: globalState.assignmentId,
    studentMode,
    tableView,
    innerRef,
    width: width < 100 ? DEFAULT_WIDTH : width, // if width < 100, something has likely gone wrong, set to default
    height: height < 100 ? DEFAULT_HEIGHT : height, // if width < 100, something has likely gone wrong, set to default
  });

  const handleDownloadImg = () => {
    if (!innerRef.current) return;
    const svg = innerRef.current.getSVG();
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "visualization.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card className="tw-mt-4 tw-rounded-lg tw-shadow-sm tw-px-4 tw-pt-4 tw-pb-2 tw-w-full">
      <div className="tw-flex tw-flex-row tw-justify-between">
        <div className="tw-flex tw-flex-col">
          <h3 className="tw-text-2xl tw-font-semibold tw-mb-1">{title}</h3>
          <p className="tw-text-xs tw-text-gray-500">{description}</p>
        </div>
      </div>
      <div
        ref={containerRef}
        className="tw-bg-gray-100 tw-rounded-md tw-min-h-96"
      >
        {childWithProps}
      </div>
      <div className="tw-flex tw-flex-row tw-justify-center tw-items-center tw-mt-1 tw-w-full">
        <div className="tw-flex tw-flex-row tw-basis-2/3 tw-justify-end tw-items-center">
          <p className="tw-text-xs tw-text-slate-500 tw-italic tw-justify-center tw-items-center tw-mt-2">
            Data is updated every 12 hours. Current changes may not be
            reflected.
          </p>
        </div>
        <div className="tw-flex tw-flex-row tw-justify-end tw-basis-1/3">
          {!tableView && (
            <button
              className="tw-underline tw-rounded-md tw-border tw-border-slate-400"
              onClick={handleDownloadImg}
            >
              <IconDownload />
            </button>
          )}
          <button
            className="tw-underline tw-ml-2 tw-rounded-md tw-border tw-border-slate-400"
            onClick={() => setTableView(!tableView)}
          >
            {tableView ? <IconBarChart /> : <IconTable />}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default VisualizationContainer;
