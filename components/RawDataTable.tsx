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
  const columnHelper = createColumnHelper<AnalyticsRawData>();

  const [data, setData] = useState<AnalyticsRawData[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    if (!globalState.courseID) return;
    fetchData();
  }, [globalState.courseID, globalState.ferpaPrivacy]);

  async function fetchData() {
    if (!globalState.courseID) return;
    const _data = await getData(globalState.courseID, globalState.ferpaPrivacy);
    setData(_data);
  }

  const transformQuartile = (quartile: number) => {
    switch (quartile) {
      case 0:
        return "Q1";
      case 1:
        return "Q2";
      case 2:
        return "Q3";
      case 3:
        return "Q4";
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
      header: "Student",
      // @ts-ignore
      filterFn: "fuzzy",
      sortingFn: fuzzySort,
    }),
    columnHelper.accessor("pagesAccessed", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Pages Accessed",
    }),
    columnHelper.accessor("uniqueInteractionDays", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Unique Interaction Days",
    }),
    columnHelper.accessor("coursePercent", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Avg % Assignment",
    }),
    columnHelper.accessor("classPercentile", {
      cell: (info) => <div>{info.getValue()}</div>,
      header: "Class Percentile",
    }),
    columnHelper.accessor("classQuartile", {
      cell: (info) => <div>{transformQuartile(info.getValue())}</div>,
      header: "Class Quartile",
    }),
  ];

  const table = useReactTable({
    data: data,
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
                <th key={header.id} className="tw-p-3 tw-text-sm tw-border-r">
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
