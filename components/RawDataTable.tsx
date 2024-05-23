"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import DebouncedInput from "./DebouncedInput";
import { Search } from "react-bootstrap-icons";
import { AnalyticsRawData } from "@/lib/types";
import { truncateString } from "@/utils/text-helpers";
import { useGlobalContext } from "@/state/globalContext";

interface RawDataTableProps {
  getData: (course_id: string) => Promise<AnalyticsRawData[]>;
}

const RawDataTable: React.FC<RawDataTableProps> = ({ getData }) => {
  const [globalState] = useGlobalContext();
  const columnHelper = createColumnHelper<AnalyticsRawData>();

  const [data, setData] = useState<AnalyticsRawData[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    if (!globalState.courseID) return;
    fetchData();
  }, [globalState.courseID]);

  async function fetchData() {
    if (!globalState.courseID) return;
    const _data = await getData(globalState.courseID);
    setData(_data);
  }

  const defaultColumns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <div>
          <span className="tw-font-semibold">
            {truncateString(info.getValue(), 40)}
          </span>
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
    data: data,
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
