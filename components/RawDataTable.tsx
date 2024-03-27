"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import DebouncedInput from "./DebouncedInput";
import { Search } from "react-bootstrap-icons";

interface RawDataTableProps {}

const demoData: AnalyticsData[] = [
  {
    id: "1",
    name: "Alice",
    pagesAccessed: 10,
    uniqueInteractionDays: 5,
    avgPercentAssignment: 80,
    classPercentile: 90,
    classQuartile: 1,
  },
  {
    id: "2",
    name: "Bob",
    pagesAccessed: 20,
    uniqueInteractionDays: 10,
    avgPercentAssignment: 70,
    classPercentile: 80,
    classQuartile: 2,
  },
  {
    id: "3",
    name: "Charlie",
    pagesAccessed: 30,
    uniqueInteractionDays: 15,
    avgPercentAssignment: 60,
    classPercentile: 70,
    classQuartile: 3,
  },
  {
    id: "4",
    name: "David",
    pagesAccessed: 40,
    uniqueInteractionDays: 20,
    avgPercentAssignment: 50,
    classPercentile: 60,
    classQuartile: 4,
  },
  {
    id: "5",
    name: "Eve",
    pagesAccessed: 50,
    uniqueInteractionDays: 25,
    avgPercentAssignment: 40,
    classPercentile: 50,
    classQuartile: 5,
  },
];

type AnalyticsData = {
  id: string;
  name: string;
  pagesAccessed: number;
  uniqueInteractionDays: number;
  avgPercentAssignment: number;
  classPercentile: number;
  classQuartile: number;
};

const RawDataTable: React.FC<RawDataTableProps> = () => {
  const columnHelper = createColumnHelper<AnalyticsData>();

  const [data, setData] = useState<AnalyticsData[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

  const defaultColumns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <div>
          <span className="tw-font-semibold">{info.getValue()}</span>
        </div>
      ),
      header: "Student",
    }),
    columnHelper.accessor("pagesAccessed", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Pages Accessed",
    }),
    columnHelper.accessor("uniqueInteractionDays", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Unique Interaction Days",
    }),
    columnHelper.accessor("avgPercentAssignment", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Avg % Assignment",
    }),
    columnHelper.accessor("classPercentile", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Class Percentile",
    }),
    columnHelper.accessor("classQuartile", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Class Quartile",
    }),
  ];

  const table = useReactTable({
    data: demoData,
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="">
      <div className="tw-flex tw-flex-row tw-w-1/4 tw-mb-2">
        <DebouncedInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder={"Search by name or email..."}
          delay={500}
          prefix
          prefixElement={<Search />}
        />
      </div>
      <table className="tw-border-solid tw-border tw-border-slate-200 tw-shadow-sm tw-bg-white tw-w-full">
        <thead className="tw-border-b tw-border-solid">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="tw-p-3 tw-text-sm tw-border-r">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:tw-bg-slate-100">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="tw-p-3 tw-border">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RawDataTable;
