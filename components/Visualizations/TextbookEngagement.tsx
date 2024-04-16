"use client";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { TextbookInteractionsCount } from "@/lib/types";
import { LIBRE_BLUE } from "@/utils/colors";
import {
  DEFAULT_BUCKET_PADDING,
  DEFAULT_HEIGHT,
  DEFAULT_MARGINS,
  DEFAULT_WIDTH,
} from "@/utils/visualizationhelpers";
import NoData from "../NoData";
import VisualizationLoading from "../VisualizationLoading";

const MARGIN = DEFAULT_MARGINS;
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING;

type TextbookEngagementProps = {
  width?: number;
  height?: number;
  getData: () => Promise<TextbookInteractionsCount[]>;
};

const TextbookEngagement = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  getData,
}: TextbookEngagementProps) => {
  const svgRef = useRef(null);
  const [data, setData] = useState<TextbookInteractionsCount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    drawChart();
  }, [width, height, data]);

  async function handleGetData() {
    try {
      setLoading(true);
      const data = await getData();
      setData(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getMaxCount = useMemo(() => {
    const vals = data.map((d) => d.numInteractions);
    if (vals.length === 0) return 200; // Default value
    return Math.max(...vals);
  }, [data]);

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    const domain = data.map((d) => d.date);

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

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.date) ?? 0)
      .attr("transform", (d) => `translate(0, ${y(d.numInteractions)})`)
      .attr("width", x.bandwidth() - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.numInteractions))
      .style("fill", LIBRE_BLUE);


    // Add Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", `-${height / 3}`)
      .attr("y", MARGIN.left / 2 - 10)
      .attr("transform", "rotate(-90)")
      .text("# of Interactions")
      .style("font-size", "12px");

    setLoading(false);
  }

  return (
    <VisualizationInnerContainer>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && data?.length > 0 && (
        <svg ref={svgRef} width={width} height={height}></svg>
      )}
      {!loading && (!data || data.length === 0) && (
        <NoData width={width} height={height} />
      )}
    </VisualizationInnerContainer>
  );
};

export default TextbookEngagement;
