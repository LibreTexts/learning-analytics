"use client";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { SubmissionTimeline as SubmissionTimelineType } from "@/lib/types";
import SelectOption from "../SelectOption";
import VisualizationLoading from "../VisualizationLoading";
import { LIBRE_BLUE } from "@/utils/colors";

const MARGIN = { top: 20, right: 20, bottom: 50, left: 50 };
const BUCKET_PADDING = 1;

type SubmissionTimelineProps = {
  width?: number;
  height?: number;
  selectedId?: string;
  getData: (
    assignment_id: string
  ) => Promise<SubmissionTimelineType[] | undefined>;
};

const SubmissionTimeline = ({
  width = 1200,
  height = 400,
  getData,
  selectedId,
}: SubmissionTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [data, setData] = useState<SubmissionTimelineType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleGetData();
  }, [selectedId]);

  useEffect(() => {
    if (data.length === 0) return;
    drawChart();
  }, [width, height, data]);

  async function handleGetData() {
    if (!selectedId) return;
    setLoading(true);
    const data = await getData(selectedId);
    setData(data ?? []);
    setLoading(false);
  }

  const getMaxCount = useMemo(() => {
    const vals = data.map((d) => d.count);
    if (vals.length === 0) return 200; // Default value
    return Math.max(...vals);
  }, [data]);

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    const domain = data.map((d) => d._id);

    const x = d3
      .scaleBand()
      .domain(domain)
      .range([MARGIN.left, width - MARGIN.right]);

    const y = d3
      .scaleLinear()
      .range([height - MARGIN.bottom, MARGIN.top])
      .domain([0, getMaxCount]);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "8px");

    svg
      .append("g")
      .call(d3.axisLeft(y))
      .attr("transform", `translate(${MARGIN.left}, 0)`);

    // Create tool tip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (e: any, d: SubmissionTimelineType) => {
      const key = d._id;
      const value = d.count;
      tooltip
        .html("Date: " + key + "<br>" + "Submissions: " + value)
        .style("opacity", 1)
        .style("visibility", "visible");
    };
    const mousemove = (e: any, d: SubmissionTimelineType) => {
      console.log(e.pageX, e.pageY);
      tooltip.style("left", e.pageX + "px").style("top", e.pageY - 5 + "px");
    };
    const mouseleave = (d: SubmissionTimelineType) => {
      tooltip.style("opacity", 0);
    };

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d._id) ?? 0)
      .attr("transform", (d) => `translate(0, ${y(d.count)})`)
      .attr("width", x.bandwidth() - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.count))
      .style("fill", LIBRE_BLUE);
    // .on("mouseover", mouseover)
    // .on("mousemove", mousemove)
    // .on("mouseleave", mouseleave);

    // Add X axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + MARGIN.left)
      .attr("y", MARGIN.top)
      .text("Submission Date")
      .style("font-size", "12px");

    // Add Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", `-${height / 3}`)
      .attr("y", MARGIN.left / 2 - 10)
      .attr("transform", "rotate(-90)")
      .text("# of Submissions")
      .style("font-size", "12px");

    setLoading(false);
  }

  return (
    <VisualizationInnerContainer ref={containerRef}>
      {!selectedId && (
        <SelectOption
          width={width}
          height={height}
          msg={"Select an assignment to view the submission timeline."}
        />
      )}
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && selectedId && (
        <svg ref={svgRef} width={width} height={height}></svg>
      )}
    </VisualizationInnerContainer>
  );
};

export default SubmissionTimeline;
