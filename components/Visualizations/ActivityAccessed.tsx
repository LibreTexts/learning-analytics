"use client";
import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import VisualizationLoading from "../VisualizationLoading";
import {
  DEFAULT_HEIGHT,
  DEFAULT_MARGINS,
  DEFAULT_WIDTH,
} from "@/utils/visualization-helpers";
import NoData from "../NoData";
import {
  ActivityAccessed as ActivityAccessedType,
  VisualizationBaseProps,
} from "@/lib/types";
import { capitalizeFirstLetter } from "@/utils/text-helpers";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import VisualizationTable from "../VisualizationTableView";

const MARGIN = { ...DEFAULT_MARGINS, bottom: 40 };

type ActivityAccessedProps = VisualizationBaseProps & {
  selectedStudentId?: string;
  getData: (student_id: string) => Promise<ActivityAccessedType>;
};

const ActivityAccessed: React.FC<ActivityAccessedProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  tableView = false,
  selectedStudentId,
  getData,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }));

  const svgRef = useRef(null);
  const [data, setData] = useState<{
    seen: number;
    unseen: number;
    course_avg_percent_seen: number;
  }>({
    seen: 0,
    unseen: 0,
    course_avg_percent_seen: 0,
  });
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(0);

  const columnHelper = createColumnHelper<{
    seen: number;
    unseen: number;
    course_avg_percent_seen: number;
  }>();
  const table = useReactTable({
    data: [data],
    columns: [
      columnHelper.accessor("seen", {
        cell: (info) => <div>{info.getValue()}</div>,
        header: "Seen",
      }),
      columnHelper.accessor("unseen", {
        cell: (info) => <div>{info.getValue()}</div>,
        header: "Unseen",
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (!selectedStudentId) return;
    handleGetData();
  }, [selectedStudentId]);

  useLayoutEffect(() => {
    if (!data || tableView) return;
    drawChart();
    setRadius(Math.min(width, height) / 2 - MARGIN.bottom);
  }, [width, height, tableView, data]);

  async function handleGetData() {
    try {
      if (!selectedStudentId) return;
      setLoading(true);
      const initData = await getData(selectedStudentId);

      const mapped = {
        seen: initData.seen.length,
        unseen: initData.unseen.length,
        course_avg_percent_seen: initData.course_avg_percent_seen,
      };

      setData(mapped);
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

    const colorScale = d3
      .scaleOrdinal()
      .domain(["seen", "unseen"])
      .range(["#1f77b4", "#ff7f0e"]);

    const pie = d3.pie().value((d: any) => {
      return d[1];
    });

    // Remove the course_avg_percent_seen key
    const dataReady = pie(
      Object.entries(data).filter(
        (d) => d[0] !== "course_avg_percent_seen"
      ) as any
    );
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    svg
      .selectAll("slices")
      .data(dataReady)
      .enter()
      .append("path")
      //@ts-ignore
      .attr("d", (d) => arcGenerator(d))
      // @ts-ignore
      .attr("fill", (d) => colorScale(d.data) as string)
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    svg
      .selectAll("slices")
      .data(dataReady)
      .enter()
      .append("text")
      // @ts-ignore
      .text((d) => `${capitalizeFirstLetter(d.data[0] ?? "")}: ${d.data[1]}`)
      .attr("transform", (d) => {
        // @ts-ignore
        return `translate(${arcGenerator.centroid(d)[0] + width / 2}, ${
          // @ts-ignore
          arcGenerator.centroid(d)[1] + height / 2
        })`;
      })
      .style("text-anchor", "middle")
      .style("font-size", 17);

    // Add course avg info
    svg
      .append("text")
      .text(`Course Average % Seen: ${data.course_avg_percent_seen.toFixed(2)}`)
      .attr("x", width - (width / 4) - MARGIN.right / 2)
      .attr("y", height - MARGIN.bottom / 2)
      .style("text-anchor", "middle")
      .style("font-size", 17)
      .style("font-weight", "bold");

    setLoading(false);
  }

  return (
    <>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && data && (
        <>
          {tableView ? (
            <VisualizationTable
              headRender={() =>
                table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
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
        </>
      )}
      {!loading && !data && <NoData width={width} height={height} />}
    </>
  );
};

export default ActivityAccessed;
