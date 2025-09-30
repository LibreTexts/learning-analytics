import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import VisualizationLoading from '../VisualizationLoading'
import {
  DEFAULT_BUCKET_PADDING,
  DEFAULT_HEIGHT,
  DEFAULT_MARGINS,
  DEFAULT_WIDTH,
} from '~/utils/visualization-helpers'
import NoData from '../NoData'
import {
  ActivityAccessed as ActivityAccessedType,
  Student,
  VisualizationBaseProps,
} from '#types/index'
import { truncateString } from '~/utils/text-helpers'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import VisualizationTable from '../VisualizationTableView'
import useAssignments from '~/hooks/useAssignmentName'
import { LIBRE_BLUE } from '~/utils/colors'

const MARGIN = DEFAULT_MARGINS
const UNSUBMITTED_LIMIT = 10
const BUCKET_PADDING = DEFAULT_BUCKET_PADDING

type StudentActivityProps = VisualizationBaseProps<ActivityAccessedType[]> & {
  selectedStudent?: Student
}

const StudentActivity: React.FC<StudentActivityProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  tableView = false,
  selectedStudent,
  data,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }))

  const svgRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const { getName } = useAssignments()

  const columnHelper = createColumnHelper<ActivityAccessedType>()
  const table = useReactTable({
    data: data,
    columns: [
      columnHelper.accessor('seen', {
        cell: (info) => <div>{info.getValue()}</div>,
        header: 'Seen',
      }),
      columnHelper.accessor('unseen', {
        cell: (info) => <div>{info.getValue()}</div>,
        header: 'Unseen',
      }),
      columnHelper.accessor('course_avg_seen', {
        cell: (info) => <div>{info.getValue()}</div>,
        header: 'Course Average Seen',
      }),
      columnHelper.accessor('course_avg_unseen', {
        cell: (info) => <div>{info.getValue()}</div>,
        header: 'Course Average Unseen',
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  })

  useLayoutEffect(() => {
    if (!data || tableView) return
    drawChart()
  }, [width, height, tableView, data])

  function getStudentPercent(data?: ActivityAccessedType) {
    if (!data) return 0
    if (!Array.isArray(data.seen) || !Array.isArray(data.unseen)) return 0
    if (data.seen.length === 0 && data.unseen.length === 0) return 0
    const total = data.seen.length + data.unseen.length
    return parseFloat(((data.seen.length / total) * 100).toFixed(2))
  }

  function getCourseAvgPercent(data: ActivityAccessedType[]) {
    if (data.length === 0) return 0
    const total = data[0].course_avg_seen + data[0].course_avg_unseen
    return parseFloat(((data[0].course_avg_seen / total) * 100).toFixed(2))
  }

  function drawChart() {
    setLoading(true)
    const subgroups = ['class_avg', 'student']
    const subgroupsPretty = ['Class Average', 'Student']
    const svg = d3.select(svgRef.current)

    svg.selectAll('*').remove() // Clear existing chart

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.assignment_id))
      .range([MARGIN.left, width - MARGIN.right])
      .padding(0.1)

    const xSubgroup = d3.scaleBand().domain(subgroups).range([0, x.bandwidth()]).padding(-0.01)

    const y = d3
      .scaleLinear()
      .range([height - MARGIN.bottom, MARGIN.top])
      .domain([0, 100])

    // Add x-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '8px')
      .text((d) => truncateString(getName(d as string), 15))

    // Add y-axis
    svg.append('g').call(d3.axisLeft(y)).attr('transform', `translate(${MARGIN.left}, 0)`)

    // Add Y axis label:
    svg
      .append('text')
      .attr('text-anchor', 'end')
      .attr('x', `-${height / 3}`)
      .attr('y', MARGIN.left / 2 - 10)
      .attr('transform', 'rotate(-90)')
      .text('% of questions submitted')
      .style('font-size', '12px')

    const color = d3.scaleOrdinal().domain(subgroups).range(['#e41a1c', LIBRE_BLUE])

    svg
      .append('g')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x(d.assignment_id)}, 0)`)
      .selectAll('rect')
      // @ts-ignore
      .data((d) => subgroups.map((key) => ({ key, value: d[key] })))
      .enter()
      .append('rect')
      .attr('x', (d) => xSubgroup(d.key) ?? 0)
      .attr('y', (d, idx) => {
        return d.key === 'class_avg'
          ? y(getCourseAvgPercent(data))
          : y(getStudentPercent(data[idx]))
      })
      .attr('width', xSubgroup.bandwidth() - BUCKET_PADDING)
      .attr(
        'height',
        (d, idx) =>
          height -
          MARGIN.bottom -
          y(d.key === 'class_avg' ? getCourseAvgPercent(data) : getStudentPercent(data[idx]))
      )
      .attr('fill', (d) => color(d.key) as string)

    // Add one dot in the legend for each name.
    svg
      .selectAll('mydots')
      .data(subgroupsPretty)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => width - 155 - (MARGIN.right + i * 155)) // 155 is the distance between dots
      .attr('cy', (d, i) => MARGIN.top / 2 - 5)
      .attr('r', 7)
      .style('fill', (d) => color(d) as string)

    // Add one dot in the legend for each name.
    svg
      .selectAll('mylabels')
      .data(subgroupsPretty)
      .enter()
      .append('text')
      .attr('x', (d, i) => width - 155 - (MARGIN.right - 15 + i * 155)) // 155 is the distance between dots, 15 is space between dot and text
      .attr('y', (d, i) => MARGIN.top / 2 - 5)
      .style('fill', (d) => color(d) as string)
      .text((d) => d)
      .attr('text-anchor', 'left')
      .style('alignment-baseline', 'middle')

    setLoading(false)
  }

  return (
    <>
      {loading && <VisualizationLoading width={width} height={height} />}
      {!loading && data && (
        <div className={`tw:w-full ${tableView ? 'tw:max-h-[500px] tw:overflow-y-auto' : ''}`}>
          {tableView ? (
            <VisualizationTable
              headRender={() =>
                table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="tw:p-3 tw:text-sm tw:border-r">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))
              }
              bodyRender={() =>
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:tw:bg-slate-100">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="tw:p-3 tw:border">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      {!loading && !data && <NoData width={width} height={height} />}
    </>
  )
}

export default StudentActivity
