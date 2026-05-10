import styles from './DataTable.module.css';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, Settings, Filter } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
}

interface DataTableProps<T> {
  data?: T[] | { data: T[] } | { roles: T[] };
  columns: Column<T>[];
  isLoading?: boolean;
  isEmpty?: boolean;
  onRowClick?: (row: T) => void;
  onAddClick?: () => void;
  emptyMessage?: string;
  enablePagination?: boolean;
}

export default function DataTable<T extends { [key: string]: any }>({
  data,
  columns,
  isLoading = false,
  isEmpty = false,
  onRowClick,
  onAddClick,
  emptyMessage = 'No data available',
  enablePagination = true,
}: DataTableProps<T>) {
  // All hooks must be called before any early returns
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState<string>('All');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.header))
  );
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract data safely
  let safeData: T[] = [];
  if (Array.isArray(data)) {
    safeData = data;
  } else if (data && typeof data === 'object') {
    const obj = data as any;
    if (Array.isArray(obj.data)) {
      safeData = obj.data;
    } else if (Array.isArray(obj.roles)) {
      safeData = obj.roles;
    }
  }

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = safeData;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => {
        if (searchColumn === 'All') {
          return columns.some((col) => {
            let value = '';
            if (typeof col.accessor === 'function') {
              value = String(col.accessor(row) ?? '').toLowerCase();
            } else {
              value = String(row[col.accessor] ?? '').toLowerCase();
            }
            return value.includes(query);
          });
        } else {
          const col = columns.find((c) => c.header === searchColumn);
          if (!col) return false;
          let value = '';
          if (typeof col.accessor === 'function') {
            value = String(col.accessor(row) ?? '').toLowerCase();
          } else {
            value = String(row[col.accessor] ?? '').toLowerCase();
          }
          return value.includes(query);
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof T];
      let bValue: any = b[sortBy as keyof T];

      // Handle dates
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      if (typeof aValue === 'string') aValue = new Date(aValue).getTime() || aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = new Date(bValue).getTime() || bValue.toLowerCase();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [safeData, searchQuery, searchColumn, columns, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const paginatedData = enablePagination ? filteredData.slice(startIdx, endIdx) : filteredData;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const toggleColumn = (columnHeader: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnHeader)) {
      newVisibleColumns.delete(columnHeader);
    } else {
      newVisibleColumns.add(columnHeader);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const visibleColumnsArray = columns.filter((col) => visibleColumns.has(col.header));

  // Early returns after all hooks are set up
  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (isEmpty || safeData.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.searchBar}>
        <div className={styles.filterSection}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
            title="Filter options"
            aria-label="Filters"
          >
            <Filter size={20} />
          </button>
          
          {showFilters && (
            <div className={styles.filterPanel}>
              <div className={styles.panelTitle}>Sorting Options</div>
              <div className={styles.filterContent}>
                <div className={styles.sortSection}>
                  <label className={styles.sortLabel}>Sort By:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.sortSelect}
                  >
                    <option value="created_at">Created</option>
                    <option value="updated_at">Updated</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="title">Title (A-Z)</option>
                    {/* <option value="status">Status</option> */}
                  </select>
                </div>

                <div className={styles.sortSection}>
                  <label className={styles.sortLabel}>Order:</label>
                  <div className={styles.orderButtons}>
                    <button
                      className={`${styles.orderButton} ${sortOrder === 'asc' ? styles.orderButtonActive : ''}`}
                      onClick={() => setSortOrder('asc')}
                    >
                      Ascending ↑
                    </button>
                    <button
                      className={`${styles.orderButton} ${sortOrder === 'desc' ? styles.orderButtonActive : ''}`}
                      onClick={() => setSortOrder('desc')}
                    >
                      Descending ↓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Search with column selector */}
        <div className={styles.searchSection}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearButton}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className={styles.columnSelector}
          >
            <option value="All">All Columns</option>
            {columns.map((col) => (
                col.header !== "Actions" && (
              <option key={col.header} value={col.header}>
                {col.header}
              </option>
                )
            ))}
          </select>
        </div>

        {/* Right: Gear icon and Add button */}
        <div className={styles.actionSection}>
          <div className={styles.columnSettingsWrapper}>
            <button
              className={styles.gearButton}
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              title="Select columns to display"
              aria-label="Column settings"
            >
              <Settings size={20} />
            </button>

            {showColumnSettings && (
              <div className={styles.columnSettingsPanel}>
                <div className={styles.panelTitle}>Choose Columns</div>
                <div className={styles.columnList}>
                  {columns.map((col) => (
                    <label key={col.header} className={styles.columnCheckbox}>
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.header)}
                        onChange={() => toggleColumn(col.header)}
                      />
                      <span>{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {onAddClick && (
            <button
              onClick={onAddClick}
              className={styles.addButton}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {filteredData.length > 0 && searchQuery && (
        <div className={styles.searchResults}>
          Showing {filteredData.length} of {safeData.length} results
        </div>
      )}

      <div className={styles.tableContainer}>
        {filteredData.length === 0 ? (
          <div className={styles.noResults}>
            No results found for "{searchQuery}"
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {visibleColumnsArray.map((col, idx) => (
                  <th key={idx} style={{ width: col.width }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row: T, rowIdx: number) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? styles.clickable : ''}
                >
                  {visibleColumnsArray.map((col, colIdx) => (
                    <td key={colIdx}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : String(row[col.accessor] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {enablePagination && filteredData.length > 0 && (
        <div className={styles.paginationFooter}>
          <div className={styles.paginationLeft}>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={styles.paginationButton}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={styles.paginationRight}>
            <label htmlFor="rows-per-page" className={styles.rowsLabel}>
              Rows per page:
            </label>
            <select
              id="rows-per-page"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.rowsDropdown}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
