"use client";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import SelectOption from "../SelectOption";
import VisualizationLoading from "../VisualizationLoading";
import {
  DEFAULT_BUCKET_PADDING,
  DEFAULT_HEIGHT,
  DEFAULT_MARGINS,
  DEFAULT_WIDTH,
} from "@/utils/visualization-helpers";
import {
  Student,
  TimeInReview as TimeInReviewType,
  VisualizationBaseProps,
} from "@/lib/types";
import { LIBRE_BLUE } from "@/utils/colors";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import VisualizationTable from "../VisualizationTableView";

const MARGIN = DEFAULT_MARGINS;
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING;

type TimeInReviewProps = VisualizationBaseProps & {
  selectedStudent?: Student;
  selectedAssignmentId?: string;
  getData: (
    student_id: string,
    assignment_id: string
  ) => Promise<TimeInReviewType[]>;
};

const TimeInReview: React.FC<TimeInReviewProps> = ({
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
  const [data, setData] = useState<TimeInReviewType[]>([]);
  const [loading, setLoading] = useState(false);

  const columnHelper = createColumnHelper<TimeInReviewType>();
  const table = useReactTable<TimeInReviewType>({
    data: data,
    columns: [
      columnHelper.accessor("question_id", {
        cell: (info) => <div>{info.getValue()}</div>,
        header: "Question ID",
      }),
      columnHelper.accessor("student_time", {
        cell: (info) => <div>{parseInt(info.getValue()).toFixed(2)}</div>,
        header: "Student Review Time (minutes)",
      }),
      columnHelper.accessor("course_avg", {
        cell: (info) => <div>{parseFloat(info.getValue()).toFixed(2)}</div>,
        header: "Class Review Average (minutes)",
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    handleGetData();
  }, [selectedStudent?.email, selectedAssignmentId]);

  useEffect(() => {
    if (data.length === 0 || tableView) return;
    buildChart();
  }, [width, height, tableView, data]);

  async function handleGetData() {
    try {
      if (!selectedStudent?.email || !selectedAssignmentId) return;
      setLoading(true);
      const data = await getData(selectedStudent.email, selectedAssignmentId);
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
      return 15; //Default value (if no data is present)
    }
    data.forEach((d) => {
      if (d.student_time > max) max = d.student_time;
      if (d.course_avg > max) max = d.course_avg;
    });
    return max;
  }, [data]);

  function buildChart() {
    setLoading(true);
    const subgroups = ["course_avg", "student_time"];
    const subgroupsPretty = ["Class Average", "Student Time"];
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.question_id.toString()))
      .range([MARGIN.left, width - MARGIN.right])
      .padding(0.1);

    const xSubgroup = d3
      .scaleBand()
      .domain(subgroups)
      .range([0, x.bandwidth()])
      .padding(-0.01);

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
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "8px")
      .text((d) => `Q: ${d}`);

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
      .text("Time (minutes)")
      .style("font-size", "12px");

    const color = d3
      .scaleOrdinal()
      .domain(subgroups)
      .range(["#e41a1c", LIBRE_BLUE]);

    svg
      .append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x(d.question_id.toString())}, 0)`)
      .selectAll("rect")
      // @ts-ignore
      .data((d) => subgroups.map((key) => ({ key, value: d[key] })))
      .enter()
      .append("rect")
      .attr("x", (d) => xSubgroup(d.key) ?? 0)
      .attr("y", (d) => y(d.value))
      .attr("width", xSubgroup.bandwidth() - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.value) ?? 0)
      .attr("fill", (d) => color(d.key) as string);

    // Add selected assignment to the graph
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "semibold")
      .text(`Assignment: ${selectedAssignmentId}`);

    // Add one dot in the legend for each name.
    svg
      .selectAll("mydots")
      .data(subgroupsPretty)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => width - 155 - (MARGIN.right + i * 155)) // 155 is the distance between dots
      .attr("cy", (d, i) => MARGIN.top / 2 - 5)
      .attr("r", 7)
      .style("fill", (d) => color(d) as string);

    // Add one dot in the legend for each name.
    svg
      .selectAll("mylabels")
      .data(subgroupsPretty)
      .enter()
      .append("text")
      .attr("x", (d, i) => width - 155 - (MARGIN.right - 15 + i * 155)) // 155 is the distance between dots, 15 is space between dot and text
      .attr("y", (d, i) => MARGIN.top / 2 - 5)
      .style("fill", (d) => color(d) as string)
      .text((d) => d)
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

    setLoading(false);
  }

  return (
    <>
      {!selectedStudent?.id && (
        <SelectOption
          width={width}
          height={height}
          msg={"Select a student to view their performance per assignment."}
        />
      )}
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && selectedStudent?.id && (
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
    </>
  );
};

export default TimeInReview;
