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
  LOCData,
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
  getData: (assignmentId: string) => Promise<LOCData[]>;
};

const LearningObjectiveCompletion: React.FC<LOCProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  getData,
  selectedAssignmentId,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [assignmentData, setAssignmentData] = useState<LOCData[]>([]);

  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const noFrameworkAlignment = useMemo(() => {
    if (!assignmentData) return true;
    return false;
  }, [assignmentData]);

  useEffect(() => {
    handleGetData();
  }, [selectedAssignmentId]);

  useEffect(() => {
    // if (
    //   data.length === 0 ||
    //   assignmentData.framework_descriptors.length === 0 ||
    //   assignmentData.framework_levels.length === 0
    // )
    //   return;
    if (!chartsRef.current) return;
    drawChart();
  }, [width, data, assignmentData, chartsRef.current]);

  async function handleGetData() {
    try {
      setLoading(true);
      if (!selectedAssignmentId) return;

      const _assignmentData = await getData(selectedAssignmentId);
      console.log(_assignmentData)

      setAssignmentData(_assignmentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const DEMO_DATA = [
    { title: "Female", value: 65 },
    { title: "Male", value: 7 },
    { title: "Female", value: 24 },
    { title: "Female", value: 31 },
    { title: "Male", value: 11 },
    { title: "Male", value: 82 },
    { title: "Female", value: 55 },
    { title: "Non-binary", value: 44 },
  ];

  function drawChart() {
    setLoading(true);
    const container = d3.select(chartsRef.current);
    container.selectAll("svg").remove();

    const chartHeight =
      height / DEMO_DATA.length > 200 ? 200 : height / DEMO_DATA.length; // set max height of 20px
    const chartWidth = width - MARGIN.left - MARGIN.right;
    const chartInnerHeight = chartHeight - MARGIN.top - MARGIN.bottom;

    DEMO_DATA.forEach((d, index) => {
      container
        .append("svg")
        .attr("width", width)
        .attr("height", chartHeight)
        .attr("id", `chart-${index}`)
        .style("margin-bottom", "20px");

      const svg = d3.select(`#chart-${index}`);

      const group = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

      const x = d3.scaleLinear().domain([0, 100]).range([0, chartWidth]);

      const y = d3
        .scaleBand()
        .domain([d.title])
        .range([0, chartInnerHeight])
        .padding(0.1);

      // add title to top left of chart
      group
        .append("text")
        .attr("x", 0)
        .attr("y", index * chartHeight - 10)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .text(d.title);

      group
        .append("g")
        .selectAll("rect")
        .data([d])
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", y(d.title) || 0)
        .attr("width", x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue");

      group
        .append("g")
        .call(d3.axisBottom(x).ticks(5))
        .attr("transform", `translate(0, ${chartInnerHeight})`);

      group.append("g").call(d3.axisLeft(y));
    });

    setLoading(false);
  }

  return (
    <div ref={containerRef}>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && (
        <div className="tw-w-full">
          {/* {assignmentData.framework_levels.map((level, index) => {
            return (
              <>
                <div key={index} className="tw-flex tw-items-center tw-mb-2">
                  <div className="tw-w-4 tw-h-4 tw-mr-2 tw-rounded-full tw-bg-blue-500"></div>
                  <div>{level.text}</div>
                </div>
              </>
            );
          })} */}
          <div className="charts-container" ref={chartsRef}></div>
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
