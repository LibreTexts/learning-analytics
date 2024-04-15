"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";
import SelectOption from "../SelectOption";
import VisualizationLoading from "../VisualizationLoading";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "@/utils/visualizationhelpers";
import { PerformancePerAssignment } from "@/lib/types";
import { LIBRE_BLUE } from "@/utils/colors";

const MARGIN = { top: 20, right: 20, bottom: 70, left: 50 };
const BUCKET_PADDING = 1;

interface PerfPerAssignmentProps {
  width?: number;
  height?: number;
  selectedId?: string;
  getData: (student_id: string) => Promise<PerformancePerAssignment[]>;
}

const PerfPerAssignment = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  selectedId,
  getData,
}: PerfPerAssignmentProps) => {
  const svgRef = useRef(null);
  const [data, setData] = useState<PerformancePerAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleGetData();
  }, [selectedId]);

  useEffect(() => {
    if (data.length === 0) return;
    buildChart();
  }, [width, height, data]);

  async function handleGetData() {
    try {
      if (!selectedId) return;
      setLoading(true);
      const data = await getData(selectedId);
      setData(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getMax = useMemo(() => {
    let max = 0;
    if (data.length === 0) {
      return 100; // Default value (if no data is present)
    }
    data.forEach((d) => {
      if (d.class_avg > max) max = d.class_avg;
      if (d.student_score > max) max = d.student_score;
    });
    return max;
  }, [data]);

  function buildChart() {
    setLoading(true);
    const subgroups = ["class_avg", "student_score"];
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.assignment_id))
      .range([MARGIN.left, width - MARGIN.right])
      .padding(0.1);

    const xSubgroup = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, x.bandwidth()])
      .padding(0.01);

    const y = d3
      .scaleLinear()
      .range([height - MARGIN.bottom, MARGIN.top])
      .domain([0, getMax]);

    // Add x-axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .style("font-size", "8px");

    // Add y-axis
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .attr("transform", `translate(${MARGIN.left}, 0)`);

    // Add Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", `-${height / 3}`)
      .attr("y", MARGIN.left / 2 - 10)
      .attr("transform", "rotate(-90)")
      .text("% score")
      .style("font-size", "12px");

    const color = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range(["#e41a1c", "#377eb8"]);

    svg
      .append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x(d.assignment_id)}, 0)`)
      .selectAll("rect")
      // @ts-ignore
      .data((d) => subgroups.map((key) => ({ key, value: d[key] })))
      .enter()
      .append("rect")
      .attr("x", (d) => xSubgroup(d.key) ?? 0)
      .attr("y", (d) => y(d.value))
      .attr("width", xSubgroup.bandwidth() - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.value))
      .attr("fill", (d) => color(d.key) as string);

    // Add one dot in the legend for each name.
    svg
      .selectAll("mydots")
      .data(subgroups)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => MARGIN.left + 10 + i * 100) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("cy", (d, i) => height - 10)
      .attr("r", 7)
      .style("fill", (d) => color(d) as string);

    // Add one dot in the legend for each name.
    svg
      .selectAll("mylabels")
      .data(subgroups)
      .enter()
      .append("text")
      .attr("x", (d, i) => MARGIN.left + 20 + i * 100) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("y", (d, i) => height - 10)
      .style("fill", (d) => color(d) as string)
      .text((d) => d)
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

    setLoading(false);
  }

  return (
    <VisualizationInnerContainer>
      {!selectedId && (
        <SelectOption
          width={width}
          height={height}
          msg={"Select a student to view their performance per assignment."}
        />
      )}
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && selectedId && (
        <svg ref={svgRef} width={width} height={height}></svg>
      )}
    </VisualizationInnerContainer>
  );
};

export default PerfPerAssignment;
