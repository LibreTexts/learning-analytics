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
    if (
      data.length === 0 ||
      assignmentData.framework_descriptors.length === 0 ||
      assignmentData.framework_levels.length === 0
    )
      return;
    drawChart();
  }, [width, height, data, assignmentData]);

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
    setLoading(true);
    // const svg = d3.select(svgRef.current);
    // svg.selectAll("*").remove();

    // // create a horizontal boxplot with demo data
    // const DEMO_DATA = [
    //   { min: 0, q1: 10, median: 20, q3: 30, max: 40 },
    //   { min: 10, q1: 20, median: 30, q3: 40, max: 50 },
    //   { min: 20, q1: 30, median: 40, q3: 50, max: 60 },
    //   { min: 30, q1: 40, median: 50, q3: 60, max: 70 },
    // ];

    // const x = d3
    //   .scaleBand()
    //   .domain(DEMO_DATA.map((d, i) => i))
    //   .range([MARGIN.left, width - MARGIN.right])
    //   .padding(0.1);

    // const y = d3
    //   .scaleLinear()
    //   .domain([0, 70])
    //   .range([height - MARGIN.bottom, MARGIN.top]);

    // const line = d3
    //   .line()
    //   .x((d, i) => x(i) + x.bandwidth() / 2)
    //   .y((d) => y(d));

    // svg
    //   .append("g")
    //   .selectAll("line")
    //   .data(DEMO_DATA)
    //   .join("line")
    //   .attr("stroke", "black")
    //   .attr("x1", (d, i) => x(i) + x.bandwidth() / 2)
    //   .attr("x2", (d, i) => x(i) + x.bandwidth() / 2)
    //   .attr("y1", (d) => y(d.min))
    //   .attr("y2", (d) => y(d.max));

    // svg
    //   .append("g")
    //   .selectAll("rect")
    //   .data(DEMO_DATA)
    //   .join("rect")
    //   .attr("stroke", "black")
    //   .attr("fill", "white")
    //   .attr("x", (d, i) => x(i))
    //   .attr("y", (d) => y(d.q3))
    //   .attr("width", x.bandwidth())
    //   .attr("height", (d) => y(d.q1) - y(d.q3));

    // svg
    //   .append("g")
    //   .selectAll("rect")
    //   .data(DEMO_DATA)
    //   .join("rect")
    //   .attr("stroke", "black")
    //   .attr("fill", "black")
    //   .attr("x", (d, i) => x(i) + x.bandwidth() * 0.25)
    //   .attr("y", (d) => y(d.median))
    //   .attr("width", x.bandwidth() * 0.5)
    //   .attr("height", 2);

    // svg
    //   .append("g")
    //   .selectAll("line")
    //   .data(DEMO_DATA)
    //   .join("line")
    //   .attr("stroke", "black")
    //   .attr("x1", (d) => x(d) + x.bandwidth() * 0.25)
    //   .attr("x2", (d) => x(d) + x.bandwidth() * 0.75)
    //   .attr("y1", (d) => y(d.median))
    //   .attr("y2", (d) => y(d.median));

    // svg
    //   .append("g")
    //   .selectAll("line")
    //   .data(DEMO_DATA)
    //   .join("line")
    //   .attr("stroke", "black")
    //   .attr("x1", (d) => x(d) + x.bandwidth() / 2)
    //   .attr("x2", (d) => x(d) + x.bandwidth() / 2)
    //   .attr("y1", (d) => y(d.q3))
    //   .attr("y2", (d) => y(d.max));

    // svg
    //   .append("g")
    //   .selectAll("line")
    //   .data(DEMO_DATA)
    //   .join("line")
    //   .attr("stroke", "black")
    //   .attr("x1", (d) => x(d) + x.bandwidth() / 2)
    //   .attr("x2", (d) => x(d) + x.bandwidth() / 2)
    //   .attr("y1", (d) => y(d.q1))
    //   .attr("y2", (d) => y(d.min));

    // svg
    //   .append("g")
    //   .call(d3.axisBottom(x))
    //   .attr("transform", `translate(0, ${height - MARGIN.bottom})`);

    // svg
    //   .append("g")
    //   .call(d3.axisLeft(y))
    //   .attr("transform", `translate(${MARGIN.left}, 0)`);

    setLoading(false);
  }

  return (
    <div ref={containerRef}>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && (
        <div className="tw-w-full">
          {assignmentData.framework_levels.map((level, index) => {
            return (
              <>
                <div key={index} className="tw-flex tw-items-center tw-mb-2">
                  <div className="tw-w-4 tw-h-4 tw-mr-2 tw-rounded-full tw-bg-blue-500"></div>
                  <div>{level.text}</div>
                </div>
              </>
            );
          })}
          {/* <svg ref={svgRef} width={width} height={height}></svg> */}
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
