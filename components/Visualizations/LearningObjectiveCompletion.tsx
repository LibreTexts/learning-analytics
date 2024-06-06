"use client";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  FrameworkAlignment,
  FrameworkData,
  GradeDistribution as GradeDistributionType,
  VisualizationBaseProps,
} from "@/lib/types";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import VisualizationTable from "../VisualizationTableView";

const MARGIN = { ...DEFAULT_MARGINS, bottom: 40 };
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING;

type LOCProps = VisualizationBaseProps & {
  selectedAssignmentId?: string;
  getAssignmentData: (assignment_id: string) => Promise<FrameworkData>;
};

const LearningObjectiveCompletion: React.FC<LOCProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  getAssignmentData,
  selectedAssignmentId,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [assignmentData, setAssignmentData] = useState<FrameworkData>({
    framework_descriptors: [],
    framework_levels: [],
  });

  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const noFrameworkAlignment = useMemo(() => {
    if (!assignmentData) return true;
    if (assignmentData.framework_descriptors.length === 0) return true;
    if (assignmentData.framework_levels.length === 0) return true;
    return false;
  }, [assignmentData]);

  useEffect(() => {
    handleGetData();
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (data.length === 0) return;
    drawChart();
  }, [width, height, data]);

  async function handleGetData() {
    try {
      setLoading(true);
      if (!selectedAssignmentId) return;

      const _assignmentData = await getAssignmentData(selectedAssignmentId);

      // we need to group the data so that wherever the framework level is the same, we collect any
      const frameworkData = _assignmentData.framework_levels.map((level) => {
        const descriptors = _assignmentData.framework_descriptors.filter(
          (descriptor) => descriptor.id === level.id
        );
        return {
          level,
          descriptors,
        };
      });

      setAssignmentData(_assignmentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function drawChart() {
    // setLoading(true);
    // const svg = d3.select(svgRef.current);
    // svg.selectAll("*").remove(); // Clear existing chart
    // const x = d3
    //   .scaleBand()
    //   .domain(["F", "D", "C", "B", "A"])
    //   .range([MARGIN.left, width - MARGIN.right]);
    // const y = d3
    //   .scaleLinear()
    //   .range([height - MARGIN.bottom, MARGIN.top])
    //   .domain([0, getMaxCount]);
    // // Add X axis
    // svg
    //   .append("g")
    //   .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
    //   .call(d3.axisBottom(x))
    //   .selectAll("text")
    //   .style("text-anchor", "end")
    //   .style("font-size", "8px");
    // // Add Y axis
    // svg
    //   .append("g")
    //   .call(d3.axisLeft(y))
    //   .attr("transform", `translate(${MARGIN.left}, 0)`);
    // // // Create tool tip
    // const tooltip = d3
    //   .select(containerRef.current)
    //   .append("div")
    //   .style("position", "absolute")
    //   .style("bottom", height - MARGIN.bottom + "px")
    //   .style("right", MARGIN.right + 10 + "px")
    //   .style("opacity", 0)
    //   .attr("class", "tooltip")
    //   .style("background-color", "white")
    //   .style("border", "solid")
    //   .style("border-width", "1px")
    //   .style("border-radius", "5px")
    //   .style("padding", "10px");
    // // Three function that change the tooltip when user hover / move / leave a cell
    // const mouseover = (e: any, d: GradeBucket) => {
    //   tooltip
    //     .html("Letter Grade: " + d.grade + "<br>" + "Count: " + d.count)
    //     .style("opacity", 1)
    //     .style("visibility", "visible");
    // };
    // const mousemove = (e: any, d: GradeBucket) => {
    //   //tooltip.style("left", e.pageX + "px").style("top", e.pageY - 5 + "px");
    // };
    // const mouseleave = (d: any) => {
    //   tooltip.style("opacity", 0);
    // };
    // svg
    //   .selectAll("rect")
    //   .data(data)
    //   .enter()
    //   .append("rect")
    //   .attr("x", (d) => x(d.grade) ?? 0)
    //   .attr("y", (d) => y(d.count) ?? 0)
    //   .attr("width", x.bandwidth() - BUCKET_PADDING)
    //   .attr("height", (d) => height - MARGIN.bottom - y(d.count))
    //   .on("mouseover", mouseover)
    //   .on("mousemove", mousemove)
    //   .on("mouseleave", mouseleave)
    //   .style("fill", LIBRE_BLUE);
    // // Add X axis label:
    // svg
    //   .append("text")
    //   .attr("text-anchor", "end")
    //   .attr("x", width / 2 + MARGIN.left)
    //   .attr("y", MARGIN.top)
    //   .text("Letter Grade")
    //   .style("font-size", "12px");
    // // Add Y axis label:
    // svg
    //   .append("text")
    //   .attr("text-anchor", "end")
    //   .attr("x", `-${height / 3}`)
    //   .attr("y", MARGIN.left / 2 - 10)
    //   .attr("transform", "rotate(-90)")
    //   .text("# of Students")
    //   .style("font-size", "12px");
    // setLoading(false);
  }

  return (
    <div ref={containerRef}>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && (
        <div className="tw-w-full tw-max-h-[500px] tw-overflow-y-auto">
          {assignmentData.framework_levels.map((level, index) => {
            return (
              <div key={index} className="tw-flex tw-items-center tw-mb-2">
                <div className="tw-w-4 tw-h-4 tw-mr-2 tw-rounded-full tw-bg-blue-500"></div>
                <div>{level.text}</div>
              </div>
            );
          })}
          {/* <svg ref={svgRef} width={width} height={height}>
            <g className="tooltip-area"></g>
          </svg> */}
        </div>
      )}
      {!loading && noFrameworkAlignment && (!data || data.length === 0) && (
        <NoData
          width={width}
          height={height}
          msg={"This assignment has no questions with framework alignments."}
        />
      )}
    </div>
  );
};

export default LearningObjectiveCompletion;
