"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";

function BarChart() {
  const svgRef = useRef<HTMLDivElement>(null);
  const data = [25, 30, 45, 60, 20];
  const width = 300;
  const height = 150;

  useEffect(() => {
    buildChart();
  }, []);

  const buildChart = () => {
    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const xScale = d3
      .scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.4);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data) as number])
      .nice()
      .range([height, 0]);

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      // @ts-ignore
      .attr("x", (_, i) => xScale(i))
      .attr("y", (d) => yScale(d))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - yScale(d))
      .attr("fill", "orange")
      .on("mouseover", (event, d) => {
        // Show tooltip on hover
        tooltip
          .html(`Value: ${d}`)
          .style("visibility", "visible")
          .style("top", `${event.pageY}px`)
          .style("left", `${event.pageX}px`);
      })
      .on("mouseout", () => {
        // Hide tooltip on mouseout
        tooltip.style("visibility", "hidden");
      });
    // Create tooltip element
    const tooltip = d3
      .select(svgRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("visibility", "hidden");
  };

  return (
    <VisualizationInnerContainer>
      <div ref={svgRef}></div>
    </VisualizationInnerContainer>
  );
}

export default BarChart;
