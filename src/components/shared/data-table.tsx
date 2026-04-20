"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnDef<T> {
  /** Unique key matching a property in T (or a computed id) */
  id: string;
  /** Header label */
  header: string;
  /** Accessor – how to read the cell value from the row */
  accessorFn?: (row: T) => unknown;
  /** Simple key accessor (alternative to accessorFn) */
  accessorKey?: keyof T;
  /** Custom cell renderer */
  cell?: (props: { row: T; value: unknown }) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Whether this column is visible by default */
  defaultVisible?: boolean;
  /** Additional className for the cell */
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Rows per page. Defaults to 10. */
  pageSize?: number;
  /** Searchable – enables a search bar that filters across all string values */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Unique row key getter */
  getRowId?: (row: T) => string;
  /** Optional empty state component */
  emptyState?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getValue<T>(row: T, col: ColumnDef<T>): unknown {
  if (col.accessorFn) return col.accessorFn(row);
  if (col.accessorKey) return row[col.accessorKey];
  return (row as Record<string, unknown>)[col.id];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<T>({
  columns,
  data,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search...",
  getRowId,
  emptyState,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortId, setSortId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    () =>
      new Set(
        columns
          .filter((c) => c.defaultVisible !== false)
          .map((c) => c.id)
      )
  );

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const v = getValue(row, col);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortId) return filtered;
    const col = columns.find((c) => c.id === sortId);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const va = getValue(a, col);
      const vb = getValue(b, col);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortId, sortDir, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = useCallback(
    (colId: string) => {
      if (sortId === colId) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortId(colId);
        setSortDir("asc");
      }
    },
    [sortId]
  );

  const toggleCol = useCallback((colId: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) {
        next.delete(colId);
      } else {
        next.add(colId);
      }
      return next;
    });
  }, []);

  const visibleColumns = columns.filter((c) => visibleCols.has(c.id));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {searchable && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibleCols.has(col.id)}
                onCheckedChange={() => toggleCol(col.id)}
              >
                {col.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {visibleColumns.map((col) => (
                <TableHead key={col.id} className={col.className}>
                  {col.sortable !== false ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.id)}
                      className="inline-flex items-center gap-1 text-left"
                    >
                      {col.header}
                      {sortId === col.id ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyState ?? "No results found."}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, idx) => {
                const rowKey = getRowId
                  ? getRowId(row)
                  : String(idx + safePage * pageSize);
                return (
                  <TableRow key={rowKey}>
                    {visibleColumns.map((col) => {
                      const value = getValue(row, col);
                      return (
                        <TableCell key={col.id} className={col.className}>
                          {col.cell
                            ? col.cell({ row, value })
                            : (value as React.ReactNode) ?? "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">{safePage * pageSize + 1}</span>
            {" - "}
            <span className="font-medium">
              {Math.min((safePage + 1) * pageSize, sorted.length)}
            </span>{" "}
            of <span className="font-medium">{sorted.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage === 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm tabular-nums text-muted-foreground">
              {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
