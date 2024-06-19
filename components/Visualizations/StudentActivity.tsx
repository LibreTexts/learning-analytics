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
  Student,
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

type StudentActivityProps = VisualizationBaseProps & {
  selectedStudent?: Student;
  getData: (student_id: string) => Promise<ActivityAccessedType>;
};

const StudentActivity: React.FC<StudentActivityProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  tableView = false,
  selectedStudent,
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
    if (!selectedStudent?.id) return;
    handleGetData();
  }, [selectedStudent?.id]);

  useLayoutEffect(() => {
    if (!data || tableView) return;
    drawChart();
    setRadius(Math.min(width, height) / 2 - MARGIN.bottom);
  }, [width, height, tableView, data]);

  async function handleGetData() {
    try {
      if (!selectedStudent?.id) return;
      setLoading(true);
      const initData = await getData(selectedStudent?.id);

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
    const subgroups = ["submitted", "not_submitted"];
    const subgroupsPretty = ["Submitted", "Not Submitted"];

    svg.selectAll("*").remove(); // Clear existing chart

    const colorScale = d3
      .scaleOrdinal()
      .domain(subgroups)
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

    // svg
    //   .selectAll("slices")
    //   .data(dataReady)
    //   .enter()
    //   .append("text")
    //   // @ts-ignore
    //   .text((d) => `${capitalizeFirstLetter(d.data[0] ?? "")}: ${d.data[1]}`)
    //   .attr("transform", (d) => {
    //     // @ts-ignore
    //     return `translate(${arcGenerator.centroid(d)[0] + width / 2}, ${
    //       // @ts-ignore
    //       arcGenerator.centroid(d)[1] + height / 2
    //     })`;
    //   })
    //   .style("text-anchor", "middle")
    //   .style("font-size", 17);

    // Add selected student name to the graph
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "semibold")
      .text(`Student: ${selectedStudent?.name}`);

    // Add one dot in the legend for each name.
    svg
      .selectAll("mydots")
      .data(subgroupsPretty)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => width - 155 - (MARGIN.right + i * 165)) // 165 is the distance between dots
      .attr("cy", (d, i) => MARGIN.top / 2 - 1) // -1 for slight vertical adjustment
      .attr("r", 7)
      .style("fill", (d) => colorScale(d) as string);

    const getCountForLabel = (label: string) => {
      if (!data) return 0;
      if (label.toLowerCase() === "submitted") return data["seen"];
      if (label.toLowerCase() === "not submitted") return data["unseen"];
      return 0;
    };

    // Add one dot in the legend for each name.
    svg
      .selectAll("mylabels")
      .data(subgroupsPretty)
      .enter()
      .append("text")
      .attr("x", (d, i) => width - 165 - (MARGIN.right - 20 + i * 165)) // 165 is the distance between dots, 15 is space between dot and text
      .attr("y", (d, i) => MARGIN.top / 2)
      .style("fill", (d) => colorScale(d) as string)
      .text((d) => `${d}: ${getCountForLabel(d)}`)
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

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

export default StudentActivity;
