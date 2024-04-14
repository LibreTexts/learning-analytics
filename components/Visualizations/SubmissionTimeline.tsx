"use client";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { SubmissionTimeline as SubmissionTimelineType } from "@/lib/types";

const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };
const BUCKET_PADDING = 1;

type SubmissionTimelineProps = {
  width?: number;
  height?: number;
  selectedId?: string;
  getData: (assignment_id: string) => Promise<SubmissionTimelineType[] | undefined>;
};

const SubmissionTimeline = ({
  width = 1000,
  height = 400,
  getData,
  selectedId,
}: SubmissionTimelineProps) => {
  const svgRef = useRef(null);
  const [data, setData] = useState<SubmissionTimelineType[]>([]);

  useEffect(() => {
    console.log("selectedId:", selectedId);
    handleGetData();
  }, [selectedId]);

  useEffect(() => {
    drawChart();
  }, [width, height, data]);

  async function handleGetData() {
    if (!selectedId) return;
    const data = await getData(selectedId);
    console.log("data:", data);
    setData(data ?? []);
  }

  function drawChart() {
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

    const x = d3.scaleOrdinal([
      data.map((d) => d._id).join(","),
      data.map((d) => d.count).join(","),
    ]);

    const y = d3
      .scaleLinear()
      .range([height - MARGIN.bottom, 0])
      .domain([0, 100]);

    svg
      .append("g")
      .call(d3.axisLeft(y))
      .attr("transform", `translate(${MARGIN.left}, 0)`);

    svg
       .selectAll("rect")
       .data(data)
       .enter()
       .append("rect")
       .attr("x", 1)
      //  .attr(
      //    "transform",
      //    (d) => `translate(${x(BUCKET_PADDING)}, ${y(d.length)})`
      //  )
      //  .attr("width", (d) => x(d.x1 ?? 0) - x(d.x0 ?? 0) - BUCKET_PADDING)
      //  .attr("height", (d) => height - MARGIN.bottom - y(d.length))
      //  .style("fill", "orange");

    // Add X axis label:
    svg
      .append("text")
      .attr("text-anchor", "center")
      .attr("x", width)
      .attr("y", height)
      .text("Submission Date");

    // Add Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "center")
      .attr("x", 0)
      .attr("y", MARGIN.top)
      .text("Frequency");
  }

  return (
    <VisualizationInnerContainer>
      <svg width={width} height={height} ref={svgRef}></svg>
    </VisualizationInnerContainer>
  );
};

export default SubmissionTimeline;
