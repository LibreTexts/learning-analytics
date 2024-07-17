import { LOCData } from "@/lib/types";
import { createRef, useEffect, useRef, useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import * as d3 from "d3";
import { DEFAULT_MARGINS, DEFAULT_WIDTH } from "@/utils/visualization-helpers";
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
} from "react-bootstrap-icons";
import LearningObjectiveQuestionsAligned from "./LearningObjectiveQuestionsAligned";

const MARGIN = {
  ...DEFAULT_MARGINS,
  bottom: 50,
};
const DEFAULT_HEIGHT = 150;

interface LearningObjectiveLevelProps {
  data: LOCData;
}

const LearningObjectiveLevel: React.FC<LearningObjectiveLevelProps> = ({
  data,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [subRefs, setSubRefs] = useState<
    React.RefObject<SVGSVGElement | null>[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [viewingSubobjectives, setViewingSubobjectives] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width ?? DEFAULT_WIDTH);
        //  setHeight(entry.contentRect.height ?? DEFAULT_HEIGHT);
      }
    });
    observer.observe(containerRef.current as Element);
  }, [containerRef.current]);

  useEffect(() => {
    if (!data || !width || !height) return;
    if (viewingSubobjectives) return;
    drawChart(); // Need to redraw the main chart when no longer viewing subobjectives

    // Ensure svgRefs array has the correct length
    setSubRefs((subRefs) =>
      Array(data.framework_descriptors.length)
        .fill(undefined)
        .map((_, i) => subRefs[i] || createRef())
    );
  }, [data, width, viewingSubobjectives]);

  useEffect(() => {
    if (!viewingSubobjectives) return;
    drawSubCharts();
  }, [viewingSubobjectives]);

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleLinear()
      .domain([0, 100])
      .range([10, width - MARGIN.right]);

    const y = d3
      .scaleBand()
      .domain([data.framework_level.text])
      .range([0, height - MARGIN.bottom - MARGIN.top])
      .padding(0.1);

    svg
      .append("g")
      .selectAll("rect")
      .data([data.framework_level])
      .enter()
      .append("rect")
      .attr("x", x(0))
      .attr("y", (y(data.framework_level.text) as number) + MARGIN.top)
      .attr("height", y.bandwidth())
      .attr("width", (d) => x(d.avg_performance))
      .attr("fill", "#22c55e");

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(2))
      .selectAll("text")
      .text((d) => `${d as string}%`);

    setLoading(false);
  }

  function drawSubCharts() {
    const SUB_DATA = data.framework_descriptors;
    if (!SUB_DATA || SUB_DATA.length === 0) return;

    setLoading(true);
    const container = d3.select(chartsRef.current);
    container.selectAll("svg").remove();

    const chartHeight =
      height / SUB_DATA.length > 200 ? 200 : height / SUB_DATA.length; // set max height of 20px
    const chartWidth = width - MARGIN.left - MARGIN.right;
    const chartInnerHeight = chartHeight - MARGIN.top - MARGIN.bottom;

    subRefs.forEach((d, index) => {
      const svg = d3.select(d.current);
      svg.selectAll("*").remove(); // clear svg
      const descriptor = SUB_DATA[index];

      const group = svg.append("g").attr("transform", `translate(10, 50)`);

      const x = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);

      const y = d3
        .scaleBand()
        .domain([descriptor.text])
        .range([0, chartInnerHeight])
        .padding(0.1);

      group
        .append("g")
        .selectAll("rect")
        .data([d])
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", y(descriptor.text) || 0)
        .attr("width", x(descriptor.avg_performance))
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue");

      group
        .append("g")
        .call(d3.axisBottom(x).ticks(5))
        .attr("transform", `translate(0, 0)`);
    });

    setLoading(false);
  }

  return (
    <Card
      className="tw-mt-4 tw-rounded-lg tw-shadow-sm tw-px-4 tw-pt-4 tw-pb-2 tw-max-w-[96%]"
      ref={containerRef}
    >
      <div className="tw-flex tw-flex-row tw-justify-between">
        <div className="tw-flex tw-flex-col">
          <div className="tw-flex tw-flex-row tw-mb-0 tw-items-center">
            <h3 className="tw-text-2xl tw-font-semibold">
              {data.framework_level.text}
            </h3>
          </div>
          {!viewingSubobjectives && (
            <p className="tw-text-xs tw-text-gray-500 tw-mt-0">
              Average performance across associated questions (
              <LearningObjectiveQuestionsAligned
                questions={data.framework_level.questions}
              />
              )
            </p>
          )}
        </div>
      </div>
      {!viewingSubobjectives && (
        <>
          <div className="tw-rounded-md tw-min-h-30">
            <svg ref={svgRef} width={width} height={height}></svg>
          </div>
          <div className="tw-flex tw-flex-col">
            <div className="tw-flex tw-items-center tw-justify-end tw-p-2 tw-cursor-pointer">
              {data.framework_descriptors.length > 0 ? (
                <p
                  className="!tw-my-0 !tw-py-0 tw-ml-2 tw-text-blue-500"
                  onClick={() => setViewingSubobjectives(true)}
                >
                  View Sub-Objective Completion
                  <ArrowRight className="tw-ml-2" />
                </p>
              ) : (
                <p className="!tw-my-0 !tw-py-0 tw-ml-2 tw-text-gray-500">
                  No Sub-Objectives Aligned
                </p>
              )}
            </div>
          </div>
        </>
      )}
      {viewingSubobjectives && (
        <div
          key="subobjectives"
          className={`tw-transition-transform tw-duration-500 tw-transform ${
            viewingSubobjectives ? "tw-translate-x-0" : "tw-translate-x-full"
          } tw-border-t tw-border-solid tw-border-t-slate-300 tw-border-l-0 tw-border-r-0 tw-border-b-0 tw-pt-2`}
        >
          <div className="tw-flex tw-items-center tw-p-2 tw-cursor-pointer">
            <p
              className="!tw-my-0 !tw-py-0 tw-text-blue-500"
              onClick={() => setViewingSubobjectives(false)}
            >
              <ArrowLeft className="tw-mr-2" />
              Back to Main Objective
            </p>
          </div>
          {data.framework_descriptors.map((d, index) => (
            <div
              key={crypto.randomUUID()}
              className={`${
                index < data.framework_descriptors.length - 1 && "tw-mb-4"
              }`}
            >
              <div className="tw-flex tw-flex-row tw-justify-between">
                <div className="tw-flex tw-flex-col">
                  <div className="tw-flex tw-flex-row tw-mb-0 tw-items-center">
                    <h3 className="tw-text-lg tw-font-semibold">{d.text}</h3>
                  </div>
                  <p className="tw-text-xs tw-text-gray-500 tw-mt-0">
                    Average performance across associated questions (
                    <LearningObjectiveQuestionsAligned
                      questions={d.questions}
                    />
                    )
                  </p>
                </div>
              </div>
              <div className="tw-rounded-md tw-min-h-[75px]">
                <svg
                  ref={subRefs[index] as React.RefObject<SVGSVGElement>}
                  width={width}
                  height={75}
                ></svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default LearningObjectiveLevel;
