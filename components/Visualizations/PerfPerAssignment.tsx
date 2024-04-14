"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";

interface PerfPerAssignmentProps {
  data: Map<string, Record<string, number>> | undefined;
}

function PerfPerAssignment(props: PerfPerAssignmentProps) {
  const svgRef = useRef<HTMLDivElement>(null);

  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const width = 1000 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;
  const subgroups = ["Class Average", "Student Score"];

  const [parsed, setParsed] = useState<Map<string, Record<string, number>>>(
    new Map()
  );
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    if (!props.data) return;
    parseData(props.data);
  }, []);

  useEffect(() => {
    if (parsed.size > 0) {
      buildChart();
    }
  }, [parsed]);

  function parseData(data: PerfPerAssignmentProps["data"]) {
    if (!data) return;

    // Determine Groups
    const _groups = new Set<string>();
    Array.from(data.keys()).forEach((key) => {
      _groups.add(key);
    });
    setGroups(Array.from(_groups));
    setParsed(data);
  }

  const getMax = () => {
    let max = 0;
    parsed.forEach((d) => {
      const values = Object.values(d);
      const _max = Math.max(...(values as number[]));
      if (_max > max) max = _max;
    });
    return max;
  };

  const buildChart = () => {
    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand().domain(groups).range([0, width]).padding(0.2);

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0));

    const yScale = d3.scaleLinear().domain([0, getMax()]).range([height, 0]);

    // Add y-axis
    //svg.append("g").call(d3.axisLeft(yScale).tickPadding(5));

    const xSubgroup = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, xScale.bandwidth()])
      .padding(0.01);

    const color = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range(["#e41a1c", "#377eb8"]);

    svg
      .selectAll("g")
      .data(parsed.entries())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${xScale(d[0])}, 0)`)
      .selectAll("rect")
      .data((d) =>
        subgroups.map((key) => ({
          key,
          value: d[1][key] !== undefined ? d[1][key] : 0,
        }))
      )
      .enter()
      .append("rect")
      // @ts-ignore
      .attr("x", (d) => xSubgroup(d.key))
      .attr("y", (d) => yScale(d.value))
      .attr("width", xSubgroup.bandwidth() / subgroups.length)
      .attr("height", (d) => height - yScale(d.value))
      .attr("fill", (d) => color(d.key) as string);
  };

  return (
    <VisualizationInnerContainer>
      <div ref={svgRef}></div>
    </VisualizationInnerContainer>
  );
}

export default PerfPerAssignment;
