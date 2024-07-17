import { LearningCurveData } from "@/lib/types";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import * as d3 from "d3";
import { DEFAULT_MARGINS, DEFAULT_WIDTH } from "@/utils/visualization-helpers";
import { ArrowRight, ArrowLeft } from "react-bootstrap-icons";
import LearningObjectiveQuestionsAligned from "./LearningObjectiveQuestionsAligned";
import VisualizationLoading from "./VisualizationLoading";

const MARGIN = {
  left: 40,
  right: 35,
  top: 30,
  bottom: 35,
};
const DEFAULT_HEIGHT = 350;

interface LearningCurveDescriptorProps {
  data: LearningCurveData;
}

const LearningCurveDescriptor: React.FC<LearningCurveDescriptorProps> = ({
  data,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

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
    drawChart(); // Need to redraw the main chart when no longer viewing subobjectives
  }, [data, width]);

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const cleaned = data.score_data.filter((d) => !isNaN(d.score));
    const maxScore = () => {
      const DEFAULT_MAX = 1;
      if (cleaned.length === 0) return DEFAULT_MAX;
      const calculated = Math.max(...cleaned.map((d) => d.score));
      return calculated > DEFAULT_MAX ? calculated : DEFAULT_MAX;
    };

    const maxAttempts = () => {
      const DEFAULT_MAX = 15;
      if (cleaned.length === 0) return DEFAULT_MAX;
      const calculated = Math.max(...cleaned.map((d) => d.num_attempts));
      return calculated > DEFAULT_MAX ? calculated : DEFAULT_MAX;
    };

    const xMax = maxAttempts();
    const yMax = maxScore();

    const x = d3
      .scaleLinear()
      .domain([1, xMax])
      .range([MARGIN.left, width - MARGIN.right]);

    const y = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([height - MARGIN.bottom, MARGIN.top]);

    svg
      .append("g")
      .selectAll("dot")
      .data(cleaned)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.num_attempts))
      .attr("cy", (d) => y(d.score))
      .attr("r", 3)
      .style("fill", "#69b3a2");

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x));

    // Add x-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("font-size", "12px")
      .attr("font-weight", "semibold")
      .text("Number of Submission Attempts");

    // Add y-axis
    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, 0)`)
      .call(d3.axisLeft(y));

    // Add y-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(10, ${height / 2}) rotate(-90)`)
      .attr("font-size", "12px")
      .attr("font-weight", "semibold")
      .text("Final Question Score");

    // Calculate the slope and intercept for the line of best fit starting at x = 1
    const filteredData = cleaned.filter((d) => d.num_attempts >= 1);
    const n = filteredData.length;
    const sumX = d3.sum(filteredData, (d) => d.num_attempts);
    const sumY = d3.sum(filteredData, (d) => d.score);
    const sumXY = d3.sum(filteredData, (d) => d.num_attempts * d.score);
    const sumXX = d3.sum(filteredData, (d) => d.num_attempts * d.num_attempts);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Determine the y-value of the line at x = 1 and clamp it to the x-axis
    let startY = intercept + slope * 1;
    if (startY < 0) startY = 0;

    // Create the line of best fit starting at x = 1
    svg
      .append("line")
      .attr("x1", x(1))
      .attr("y1", y(intercept + slope))
      .attr("x2", x(xMax))
      .attr("y2", y(Math.max(0, intercept + slope * xMax)))
      .attr("stroke", "blue")
      .attr("stroke-width", 1);

    setLoading(false);
  }

  return (
    <Card
      className="tw-mt-4 tw-rounded-lg tw-shadow-sm tw-px-4 tw-pt-4 tw-pb-2 tw-max-w-[96%]"
      ref={containerRef}
    >
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && (
        <>
          <div className="tw-flex tw-flex-row tw-justify-between">
            <div className="tw-flex tw-flex-col">
              <div className="tw-flex tw-flex-row tw-mb-0 tw-items-center">
                <h3 className="tw-text-2xl tw-font-semibold">
                  {data.descriptor.text}
                </h3>
              </div>

              <p className="tw-text-xs tw-text-gray-500 tw-mt-0">
                Average performance across associated questions (
                <LearningObjectiveQuestionsAligned
                  questions={data.descriptor.questions}
                />
                )
              </p>
            </div>
          </div>
          <div className="tw-rounded-md">
            <svg ref={svgRef} width={width} height={height}></svg>
          </div>
        </>
      )}
    </Card>
  );
};

export default LearningCurveDescriptor;
