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
  SubmissionTimeline as SubmissionTimelineType,
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
import { ICalcADAPTSubmissionsByDate_Raw } from "@/lib/models/calcADAPTSubmissionsByDate";
import { format, formatDate } from "date-fns";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import VisualizationTable from "../VisualizationTableView";
import { DATE_ONLY_FORMAT, DEFAULT_DATE_FORMAT } from "@/utils/misc";

const MARGIN = DEFAULT_MARGINS;
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING;

type SubmissionTimelineProps = VisualizationBaseProps & {
  selectedAssignmentId?: string;
  studentMode?: boolean;
  getData: (
    assignment_id: string
  ) => Promise<ICalcADAPTSubmissionsByDate_Raw[] | undefined>;
};

const SubmissionTimeline: React.FC<SubmissionTimelineProps> = ({
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
  const [data, setData] = useState<ICalcADAPTSubmissionsByDate_Raw[]>([]);
  const [loading, setLoading] = useState(false);

  const columnHelper = createColumnHelper<ICalcADAPTSubmissionsByDate_Raw>();
  const table = useReactTable<ICalcADAPTSubmissionsByDate_Raw>({
    data: data,
    columns: [
      columnHelper.group({
        id: "assignment",
        header: () => (
          <div className="tw-mb-0">
            <p className="text-center tw-mb-0">
              Assignment: {data[0].assignmentID ?? "Unknown"} - Due Date:{" "}
              {formatDate(data[0].dueDate, DEFAULT_DATE_FORMAT) ?? "Unknown"}
            </p>
          </div>
        ),
        columns: [
          columnHelper.accessor("date", {
            cell: (info) => (
              <div>
                {formatDate(info.getValue().toString(), DATE_ONLY_FORMAT)}
              </div>
            ),
            header: "Submission Date",
          }),
          columnHelper.accessor("count", {
            cell: (info) => <div>{info.getValue()}</div>,
            header: "Submission Count",
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
    if (tableView) return;
    drawChart();
  }, [width, height, data, tableView]);

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

  const getMaxCount = useMemo(() => {
    const vals = data.map((d) => d.count);
    if (vals.length === 0) return 200; // Default value
    return Math.max(...vals);
  }, [data]);

  function drawChart() {
    setLoading(true);
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear existing chart

    const domain = data.map((d) => format(d.date, "MM/dd/yyyy"));
    const dueDate = format(data[0].dueDate, "MM/dd/yyyy");

    // check if dueDate is in the domain
    if (!domain.includes(dueDate)) {
      domain.push(dueDate);
    }

    const x = d3
      .scaleBand()
      .domain(domain)
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

    // Add a vertical line for the due date
    svg
      .append("line")
      .attr("x1", x(dueDate) ?? 0 + x.bandwidth() / 2)
      .attr("x2", x(dueDate) ?? 0 + x.bandwidth() / 2)
      .attr("y1", MARGIN.top)
      .attr("y2", height - MARGIN.bottom)
      .style("stroke", "red")
      .style("stroke-dasharray", "4");

    // Create tool tip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (e: any, d: SubmissionTimelineType) => {
      const key = d._id;
      const value = d.count;
      tooltip
        .html("Date: " + key + "<br>" + "Submissions: " + value)
        .style("opacity", 1)
        .style("visibility", "visible");
    };
    const mousemove = (e: any, d: SubmissionTimelineType) => {
      tooltip.style("left", e.pageX + "px").style("top", e.pageY - 5 + "px");
    };
    const mouseleave = (d: SubmissionTimelineType) => {
      tooltip.style("opacity", 0);
    };

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(format(d.date, "MM/dd/yyyy")) ?? 0)
      .attr("transform", (d) => `translate(0, ${y(d.count)})`)
      .attr("width", x.bandwidth() - BUCKET_PADDING)
      .attr("height", (d) => height - MARGIN.bottom - y(d.count))
      .style("fill", LIBRE_BLUE);
    // .on("mouseover", mouseover)
    // .on("mousemove", mousemove)
    // .on("mouseleave", mouseleave);

    // Add X axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + MARGIN.left)
      .attr("y", MARGIN.top)
      .text("Submission Date")
      .style("font-size", "12px");

    // Add Y axis label:
    svg
      .append("text")
      .attr("text-anchor", "end")
      .attr("x", `-${height / 3}`)
      .attr("y", MARGIN.left / 2 - 10)
      .attr("transform", "rotate(-90)")
      .text("# of Submissions")
      .style("font-size", "12px");

    setLoading(false);
  }

  return (
    <div ref={containerRef}>
      {!selectedAssignmentId && (
        <SelectOption
          width={width}
          height={height}
          msg={"Select an assignment to view the submission timeline."}
        />
      )}
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && selectedAssignmentId && data?.length > 0 && (
        <div className={`tw-w-full ${tableView ? 'tw-max-h-[500px] tw-overflow-y-auto' : ""}`}>
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
            <svg ref={svgRef} width={width} height={height}></svg>
          )}
        </div>
      )}
      {!loading && selectedAssignmentId && (!data || data.length === 0) && (
        <NoData width={width} height={height} />
      )}
    </div>
  );
};

export default SubmissionTimeline;
