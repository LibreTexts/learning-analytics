"use client";
import VisualizationInnerContainer from "@/components/VisualizationInnerContainer";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import VisualizationLoading from "../VisualizationLoading";
import { LIBRE_BLUE } from "@/utils/colors";
import {
  DEFAULT_BUCKET_PADDING,
  DEFAULT_HEIGHT,
  DEFAULT_MARGINS,
  DEFAULT_WIDTH,
} from "@/utils/visualization-helpers";
import NoData from "../NoData";

const MARGIN = { ...DEFAULT_MARGINS, bottom: 40 };
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING;

type GradeBucket = {
  grade: string;
  count: number;
};

type GradeDistributionProps = {
  width?: number;
  height?: number;
  getData: () => Promise<string[]>;
};

const GradeDistribution = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  getData,
}: GradeDistributionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [data, setData] = useState<GradeBucket[]>([]);
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

      // count the # of occurrences of each grade (d3.bin() does not support string data)
      const gradeCountArray = data.reduce((acc, grade) => {
        const existing = acc.find((g) => g.grade === grade);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ grade, count: 1 });
        }
        return acc;
      }, [] as GradeBucket[]);
      setData(gradeCountArray);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

    const x = d3
      .scaleBand()
      .domain(["F", "D", "C", "B", "A"])
      .range([MARGIN.left, width - MARGIN.right]);

    const y = d3
      .scaleLinear()
      .range([height - MARGIN.bottom, MARGIN.top])
      .domain([0, getMaxCount]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "8px");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .attr("transform", `translate(${MARGIN.left}, 0)`);

    // // Create tool tip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("bottom", height - MARGIN.bottom + "px")
      .style("right", MARGIN.right + 10 + "px")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (e: any, d: GradeBucket) => {
      tooltip
        .html("Letter Grade: " + d.grade + "<br>" + "Count: " + d.count)
        .style("opacity", 1)
        .style("visibility", "visible");
    };
    const mousemove = (e: any, d: GradeBucket) => {
      //tooltip.style("left", e.pageX + "px").style("top", e.pageY - 5 + "px");
    };
    const mouseleave = (d: any) => {
      tooltip.style("opacity", 0);
    };

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.grade) ?? 0)
      .attr("y", (d) => y(d.count) ?? 0)
      .attr("width", x.bandwidth() - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.count))
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .style("fill", LIBRE_BLUE);

    // Add X axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + MARGIN.left)
      .attr("y", MARGIN.top)
      .text("Letter Grade")
      .style("font-size", "12px");

    // Add Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", `-${height / 3}`)
      .attr("y", MARGIN.left / 2 - 10)
      .attr("transform", "rotate(-90)")
      .text("# of Students")
      .style("font-size", "12px");

    setLoading(false);
  }

  return (
    <VisualizationInnerContainer ref={containerRef}>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && data?.length > 0 && (
        <svg ref={svgRef} width={width} height={height}>
          <g className="tooltip-area"></g>
        </svg>
      )}
      {!loading && (!data || data.length === 0) && (
        <NoData width={width} height={height} />
      )}
    </VisualizationInnerContainer>
  );
};

export default GradeDistribution;
