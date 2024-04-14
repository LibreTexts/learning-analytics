"use client";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };
const BUCKET_PADDING = 1;

type TextbookEngagementProps = {
  width?: number;
  height?: number;
  getData: () => Promise<number[] | undefined>;
};

const TextbookEngagement = ({
  width = 1000,
  height = 400,
  getData,
}: TextbookEngagementProps) => {
  const svgRef = useRef(null);
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    drawChart();
  }, [width, height, data]);

  async function handleGetData() {
    const data = await getData();
    setData(data ?? []);
  }

  function drawChart() {
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, 100])
      .range([MARGIN.left, width - MARGIN.right]);
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x));

    const histogram = d3
      .bin()
      .value((d) => d)
      .domain([0, 100])
      .thresholds(10);

    const bins = histogram(data ?? []);

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
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", 1)
      .attr(
        "transform",
        (d) => `translate(${x(d.x0 ?? 0) + BUCKET_PADDING}, ${y(d.length)})`
      )
      .attr("width", (d) => x(d.x1 ?? 0) - x(d.x0 ?? 0) - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.length))
      .style("fill", "orange");
  }

  return (
    <VisualizationInnerContainer>
      <svg width={width} height={height} ref={svgRef}></svg>
    </VisualizationInnerContainer>
  );
};

export default TextbookEngagement;
