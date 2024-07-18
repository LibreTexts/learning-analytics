import { LearningCurveData } from "@/lib/types";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import * as d3 from "d3";
import { DEFAULT_MARGINS, DEFAULT_WIDTH } from "@/utils/visualization-helpers";
import { ArrowRight, ArrowLeft } from "react-bootstrap-icons";
import LearningObjectiveQuestionsAligned from "./LearningObjectiveQuestionsAligned";
import VisualizationLoading from "./VisualizationLoading";
import { format, parseISO } from "date-fns";

const MARGIN = {
  left: 40,
  right: 35,
  top: 30,
  bottom: 40,
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
    drawChart();
  }, [data, width]);

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const cleaned = data.score_data.filter((d) => !isNaN(d.avg_percent));
    const domain = data.score_data.map((d) =>
      format(d.submission_date, "MM/dd/yyyy")
    );

    const x = d3
      .scaleBand()
      .domain(domain)
      .range([MARGIN.left, width - MARGIN.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - MARGIN.bottom, MARGIN.top]);

    svg
      .append("g")
      .selectAll("dot")
      .data(cleaned)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(format(d.submission_date, "MM/dd/yyyy")) ?? 0)
      .attr("cy", (d) => y(d.avg_percent))
      .attr("r", 4)
      .style("fill", "#69b3a2");

    // Add x-axis, only show 8 ticks
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(
        d3.axisBottom(x).tickValues(
          x.domain().filter((d, i) => i % Math.ceil(domain.length / 8) === 0)
        )
      );

    // Add x-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("font-size", "12px")
      .attr("font-weight", "semibold")
      .text("Submission Date")

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
      .text("Avg Percent Correct");

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
