"use client";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import {
  SubmissionTimeline as ADAPTPerformanceType,
  VisualizationBaseProps,
} from "@/lib/types";
import SelectOption from "../SelectOption";
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
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import VisualizationTable from "../VisualizationTableView";

const MARGIN = { ...DEFAULT_MARGINS, bottom: 40 };
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING;

type ADAPTPerformanceProps = VisualizationBaseProps & {
  selectedAssignmentId?: string;
  studentMode?: boolean;
  getData: (assignment_id: string) => Promise<number[]>;
};

const ADAPTPerformance: React.FC<ADAPTPerformanceProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  tableView = false,
  getData,
  selectedAssignmentId,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate the buckets of 5% each
  const transformedForTable = useMemo(() => {
    const buckets = Array.from({ length: 20 }, (_, i) => {
      const start = i * 5;
      const end = start + 5;
      return {
        range: `${start}-${end}`,
        count: data.filter((d) => d >= start && d < end).length,
      };
    });
    return buckets;
  }, [data]);

  const columnHelper = createColumnHelper<{ range: string; count: number }>();
  const table = useReactTable<{ range: string; count: number }>({
    data: transformedForTable,
    columns: [
      columnHelper.group({
        id: "assignment",
        header: () => (
          <div className="tw-mb-0">
            <p className="text-center tw-mb-0">
              Assignment: {selectedAssignmentId ?? "Unknown"}{" "}
            </p>
          </div>
        ),
        columns: [
          columnHelper.accessor("range", {
            cell: (info) => <div>{info.getValue()}</div>,
            header: "Score Range (%)",
          }),
          columnHelper.accessor("count", {
            cell: (info) => <div>{info.getValue()}</div>,
            header: "Student Count",
          }),
        ],
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    handleGetData();
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (data.length === 0) return;
    drawChart();
  }, [width, height, data]);

  async function handleGetData() {
    try {
      if (!selectedAssignmentId) return;
      setLoading(true);
      const data = await getData(selectedAssignmentId);
      setData(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    const bucketGenerator = d3
      .bin()
      .value((d) => d)
      .domain([0, 100])
      .thresholds(20);

    const buckets = bucketGenerator(data);

    const maxCount = d3.max(buckets, (d) => d.length);

    const x = d3
      .scaleLinear()
      .domain([0, 100])
      .range([MARGIN.left, width - MARGIN.right]);

    const y = d3
      .scaleLinear()
      .range([height - MARGIN.bottom, MARGIN.top])
      .domain([0, maxCount ?? 100]);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x).ticks(20))
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
    // .attr("transform", `translate(${MARGIN.left}, -${height - MARGIN.bottom})`);

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (e: any, d: d3.Bin<number, number>) => {
      tooltip
        .html(
          "Score Range: " +
            d.x0 +
            "% - " +
            d.x1 +
            "%" +
            "<br>" +
            "Count: " +
            d.length
        )
        .style("opacity", 1)
        .style("visibility", "visible");
    };
    const mousemove = (e: any, d: d3.Bin<number, number>) => {
      //tooltip.style("left", e.pageX + "px").style("top", e.pageY - 5 + "px");
    };
    const mouseleave = (d: ADAPTPerformanceType) => {
      tooltip.style("opacity", 0);
    };

    svg
      .selectAll("rect")
      .data(buckets)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.x0 ?? 0) ?? 0)
      .attr("y", (d) => y(d.length) ?? 0)
      .attr("width", (d) => x(d.x1 ?? 0) - x(d.x0 ?? 0) - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.length))
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .style("fill", LIBRE_BLUE);

    // Add X axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + MARGIN.left)
      .attr("y", height - 5)
      .text("Score Range (%)")
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
    <div ref={containerRef}>
      {!selectedAssignmentId && (
        <SelectOption
          width={width}
          height={height}
          msg={"Select an assignment to view the performance data."}
        />
      )}
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && selectedAssignmentId && data?.length > 0 && (
        <div
          className={`tw-w-full ${
            tableView ? "tw-max-h-[500px] tw-overflow-y-auto" : ""
          }`}
        >
          {tableView ? (
            <VisualizationTable
              headRender={() =>
                table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className="tw-p-3 tw-text-sm tw-border-r"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))
              }
              bodyRender={() =>
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:tw-bg-slate-100">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="tw-p-3 tw-border">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              }
            />
          ) : (
            <svg ref={svgRef} width={width} height={height}>
              <g className="tooltip-area"></g>
            </svg>
          )}
        </div>
      )}
      {!loading && selectedAssignmentId && (!data || data.length === 0) && (
        <NoData width={width} height={height} />
      )}
    </div>
  );
};

export default ADAPTPerformance;
