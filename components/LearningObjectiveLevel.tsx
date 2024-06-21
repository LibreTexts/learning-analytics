import { LOCData } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import * as d3 from "d3";
import { DEFAULT_MARGINS, DEFAULT_WIDTH } from "@/utils/visualization-helpers";
import { ChevronRight, ChevronDown } from "react-bootstrap-icons";

const MARGIN = DEFAULT_MARGINS;
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
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [subObjectivesOpen, setSubObjectivesOpen] = useState(false);

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
    drawSubCharts();
  }, [data, width]);

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

    SUB_DATA.forEach((d, index) => {
      container
        .append("svg")
        .attr("width", width)
        .attr("height", chartHeight)
        .attr("id", `chart-${index}`)
        .style("margin-bottom", "20px");

      const svg = d3.select(`#chart-${index}`);

      const group = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

      const x = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);

      const y = d3
        .scaleBand()
        .domain([d.text])
        .range([0, chartInnerHeight])
        .padding(0.1);

      // add title to top left of chart
      group
        .append("text")
        .attr("x", 0)
        .attr("y", index * chartHeight - 10)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .text(d.text);

      group
        .append("g")
        .selectAll("rect")
        .data([d])
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", y(d.text) || 0)
        .attr("width", x(d.avg_performance))
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue");

      group
        .append("g")
        .call(d3.axisBottom(x).ticks(5))
        .attr("transform", `translate(0, ${chartInnerHeight})`);

      group.append("g").call(d3.axisLeft(y));
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
          <p className="tw-text-xs tw-text-gray-500 tw-mt-0">
            Average performance across associated questions (
            {data.framework_level.question_count} questions aligned)
          </p>
        </div>
      </div>
      <div className="tw-rounded-md tw-min-h-36">
        <svg ref={svgRef} width={width} height={height}></svg>
      </div>
      <div className="tw-border-[0.75px] tw-border-solid tw-border-slate-300 tw-shadow-sm tw-rounded-md tw-flex tw-flex-col">
        <div
          className="tw-flex tw-items-center tw-p-2 tw-cursor-pointer"
          onClick={() => setSubObjectivesOpen(!subObjectivesOpen)}
        >
          {subObjectivesOpen ? <ChevronDown /> : <ChevronRight />}
          <p className="!tw-my-0 !tw-py-0 tw-ml-2">
            View Sub-Objective Completion
          </p>
        </div>
        {subObjectivesOpen && (
          <>
            {data.framework_descriptors.length === 0 ? (
              <div className="tw-p-2">
                <p>No sub-objectives aligned to this learning objective.</p>
              </div>
            ) : (
              <div ref={chartsRef} className="tw-p-2"></div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default LearningObjectiveLevel;
