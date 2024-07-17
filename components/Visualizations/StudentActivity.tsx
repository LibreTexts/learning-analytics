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
import useAssignments from "@/hooks/useAssignmentName";

const MARGIN = { ...DEFAULT_MARGINS, bottom: 40 };
const UNSUBMITTED_LIMIT = 10;

type ActivityAccessedSingle = {
  seen: number;
  unseen: number;
};

type StudentActivityProps = VisualizationBaseProps & {
  selectedStudent?: Student;
  selectedAssignmentId?: string;
  getData: (
    student_id: string,
    assignment_id: string
  ) => Promise<ActivityAccessedType>;
};

const StudentActivity: React.FC<StudentActivityProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  tableView = false,
  selectedStudent,
  selectedAssignmentId,
  getData,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }));

  const svgRef = useRef(null);
  const [data, setData] = useState<ActivityAccessedSingle>({
    seen: 0,
    unseen: 0,
  });
  const [unsubmitted, setUnsubmitted] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(0);
  const { getName } = useAssignments();

  const columnHelper = createColumnHelper<ActivityAccessedSingle>();
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
    if (!selectedStudent?.id || !selectedAssignmentId) return;
    handleGetData();
  }, [selectedStudent?.id, selectedAssignmentId]);

  useLayoutEffect(() => {
    if (!data || tableView) return;
    drawChart();
    setRadius(Math.min(width, height) / 2 - MARGIN.bottom);
  }, [width, height, tableView, data]);

  async function handleGetData() {
    try {
      if (!selectedStudent?.id || !selectedAssignmentId) return;
      setLoading(true);
      const initData = await getData(selectedStudent?.id, selectedAssignmentId);

      const mapped = {
        seen: initData.seen.length,
        unseen: initData.unseen.length,
      };

      setData(mapped);
      setUnsubmitted(initData.unseen.map((id) => id.toString()));
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

    // Truncate the unsubmitted questions to UNSUBMITTED_LIMIT
    const unsubmittedTruncated = unsubmitted.slice(0, UNSUBMITTED_LIMIT);

    svg.selectAll("*").remove(); // Clear existing chart

    const colorScale = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range(["#1f77b4", "#ff7f0e"]);
    
    const labelScale = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range([0, 1]);

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
    const labelArcGenerator = d3
      .arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.5);

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

    // Add labels
    svg
      .selectAll("slices")
      .data(dataReady)
      .enter()
      .append("text")
      // @ts-ignore
      .text((d) => labelScale(d.data) === 0 ? "Submitted" : unsubmitted.length > 0 ? "Not Submitted" : "") // Only show "Not Submitted" if there are unsubmitted questions
      // @ts-ignore
      .attr("transform", (d) => `translate(${labelArcGenerator.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "semibold")
      .attr("transform", (d) => {
        // @ts-ignore
        const pos = labelArcGenerator.centroid(d);
        pos[0] = pos[0] * 2; // Change the 1.5 to another value to move the label further or closer
        pos[1] = pos[1] * 1.5;
        return `translate(${pos}) translate(${width / 2}, ${height / 2})`;
      });

    if (unsubmitted.length > 0) {
      // Add "Not Submitted" to the legend
      svg
        .append("text")
        .attr("x", width - 155 - (MARGIN.right + 10)) // 10 is space between dot and text
        .attr("y", MARGIN.top / 2 - 1) // -1 for slight vertical adjustment
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .style("font-weight", "semibold")
        .style("fill", "#ff7f0e") // orange
        .text(
          `Not Submitted (${
            (data.unseen / (data.seen + data.unseen)) * 100
          }%) :`
        );

      // Add one dot in the legend for each unseen question
      svg
        .selectAll("mydots")
        .data(unsubmittedTruncated)
        .enter()
        .append("circle")
        .attr("cx", width - 155 - (MARGIN.right + 10)) // Align dots vertically
        .attr("cy", (d, i) => MARGIN.top / 2 + 15 * (i + 1)) // 15 is the distance between dots vertically
        .attr("r", 3)
        .style("fill", "#ff7f0e"); // orange

      // Add text to the legend for each unseen question
      svg
        .selectAll("mylabels")
        .data(unsubmittedTruncated)
        .enter()
        .append("text")
        .attr("x", width - 145 - (MARGIN.right + 10)) // Align text next to the dots
        .attr("y", (d, i) => MARGIN.top / 2 + 15 * (i + 1)) // Match the vertical position of the corresponding dot
        .style("fill", "#ff7f0e") // orange
        .text((d, i) => `Q: ${d}`)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

      if (unsubmitted.length > UNSUBMITTED_LIMIT) {
        // Add "..." to the legend
        svg
          .append("text")
          .attr("x", width - 145 - (MARGIN.right + 10)) // Align text next to the dots
          .attr("y", MARGIN.top / 2 + 15 * (unsubmittedTruncated.length + 1)) // Match the vertical position of the corresponding dot
          .style("fill", "#ff7f0e") // orange
          .text(`+ ${unsubmitted.length - UNSUBMITTED_LIMIT} more...`)
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle");
      }
    } else {
      // Add "All Questions Submitted" to the legend
      svg
        .append("text")
        .attr("x", width - 155 - MARGIN.right)
        .attr("y", MARGIN.top / 2 - 1) // -1 for slight vertical adjustment
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .style("font-weight", "semibold")
        .style("fill", "#1f77b4") // blue
        .text("All Questions Submitted");
    }

    // Add selected assignment to the graph
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "semibold")
      .text(`Assignment: ${getName(selectedAssignmentId)}`);

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
