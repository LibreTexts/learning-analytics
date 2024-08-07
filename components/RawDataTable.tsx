"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
  SortingFn,
  sortingFns,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  RankingInfo,
  rankItem,
  compareItems,
} from "@tanstack/match-sorter-utils";
import { useEffect, useState } from "react";
import DebouncedInput from "./DebouncedInput";
import { Search } from "react-bootstrap-icons";
import { AnalyticsRawData } from "@/lib/types";
import { truncateString } from "@/utils/text-helpers";
import { useGlobalContext } from "@/state/globalContext";
import { Alert } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import LoadingComponent from "./LoadingComponent";

// declare module '@tanstack/react-table' {
//   //add fuzzy filter to the filterFns
//   interface FilterFns {
//     fuzzy: FilterFn<unknown>
//   }
//   interface FilterMeta {
//     itemRank: RankingInfo
//   }
// }

interface RawDataTableProps {
  getData: (
    course_id: string,
    privacy_mode: boolean
  ) => Promise<AnalyticsRawData[]>;
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0;

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      //@ts-ignore
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      // @ts-ignore
      rowB.columnFiltersMeta[columnId]?.itemRank!
    );
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

const RawDataTable: React.FC<RawDataTableProps> = ({ getData }) => {
  const [globalState] = useGlobalContext();
  const { data, isFetching } = useQuery<AnalyticsRawData[]>({
    queryKey: ["raw-data", globalState.courseID, globalState.ferpaPrivacy],
    queryFn: () => getData(globalState.courseID, globalState.ferpaPrivacy),
    enabled: !!globalState.courseID,
  });

  const columnHelper = createColumnHelper<AnalyticsRawData>();
  const [searchInput, setSearchInput] = useState<string>("");

  const transformQuartile = (quartile: number) => {
    switch (quartile) {
      case 0:
        return "Q1 (Bottom 25%)";
      case 1:
        return "Q2";
      case 2:
        return "Q3";
      case 3:
        return "Q4 (Top 25%)";
      default:
        return "Unknown";
    }
  };

  const defaultColumns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <div>
          <span className="tw-font-semibold">
            {truncateString(info.getValue(), 30)}
          </span>
        </div>
      ),
      header: "Student ID",
      // @ts-ignore
      filterFn: "fuzzy",
      sortingFn: fuzzySort,
    }),
    columnHelper.accessor("not_submitted", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Questions Not Submitted",
    }),
    columnHelper.accessor("submitted", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Questions Submitted",
    }),
    columnHelper.display({
      id: "percent_submitted",
      header: "% Submitted",
      cell: (info) => {
        const total =
          info.row.original.not_submitted + info.row.original.submitted;
        const percent = (info.row.original.submitted / total) * 100;
        const formatted = percent === 100 ? "100" : percent.toPrecision(3);
        return <div>{formatted}%</div>;
      },
    }),
    columnHelper.accessor("avg_time_on_task", {
      cell: (info) => <div>{Math.round(info.getValue() ?? "0")}</div>,
      header: "Avg Time on Task (min)",
    }),
    columnHelper.accessor("avg_time_in_review", {
      cell: (info) => <div>{Math.round(info.getValue()) ?? "0"}</div>,
      header: "Avg Time in Review (min)",
    }),
    columnHelper.accessor("course_percent", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Un-Weighted Avg %",
    }),
    columnHelper.accessor("class_quartile", {
      cell: (info) => <div>{transformQuartile(info.getValue())}</div>,
      header: "Class Quartile",
    }),
  ];

  const table = useReactTable({
    data: data ?? [],
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    // @ts-ignore
    globalFilterFn: "fuzzy",
    onGlobalFilterChange: (value) => setSearchInput(value),
    state: {
      globalFilter: searchInput,
    },
  });

  return (
    <div className="">
      {isFetching && <LoadingComponent />}
      {!isFetching && (
        <>
          {!globalState.courseLetterGradesReleased && (
            <Alert variant="warning">
              Final grades have not been released for this course. The data
              displayed here may not be accurate.
            </Alert>
          )}
          <div className="tw-flex tw-flex-row tw-w-1/3 tw-mb-2">
            <DebouncedInput
              value={searchInput}
              onChange={(val) => setSearchInput(val)}
              placeholder={"Search by name or email..."}
              delay={250}
              prefix
              prefixElement={<Search />}
            />
          </div>
          <table className="tw-border-solid tw-border tw-border-slate-200 tw-shadow-sm tw-bg-white tw-w-full">
            <thead className="tw-border-b tw-border-solid">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="tw-p-3 tw-text-sm tw-border-r"
                    >
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        className="!tw-cursor-pointer"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted()
                          ? header.column.getIsSorted() === "desc"
                            ? " 🔽"
                            : " 🔼"
                          : ""}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowCount() === 0 && (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="tw-text-center tw-p-3"
                  >
                    No data available
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row) => (
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
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default RawDataTable;
