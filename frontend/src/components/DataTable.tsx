'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface FilterOption<T> {
  key: string;
  label: string;
  type: 'select' | 'multiselect';
  options: { value: string; label: string }[];
  getValue?: (item: T) => string | string[];
  filterFn?: (item: T, selectedValues: string[]) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: FilterOption<T>[];
  serverSide?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  actions,
  emptyMessage = 'No data available',
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys,
  filters,
  serverSide = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onFilterChange,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    if (serverSide && onFilterChange) {
      onFilterChange(activeFilters);
    }
  }, [activeFilters, onFilterChange, serverSide]);

  // Filter data based on search query and filters
  const filteredData = useMemo(() => {
    if (serverSide) {
      return data;
    }
    let result = data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const keysToSearch = searchKeys || (columns.map((col) => col.key) as (keyof T)[]);

      result = result.filter((item) =>
        keysToSearch.some((key) => {
          const value = item[key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply custom filters
    if (filters && filters.length > 0) {
      result = result.filter((item) => {
        return filters.every((filter) => {
          const selectedValues = activeFilters[filter.key] || [];
          
          // If no filter selected, include all items
          if (selectedValues.length === 0) return true;

          // Use custom filter function if provided
          if (filter.filterFn) {
            return filter.filterFn(item, selectedValues);
          }

          // Default filter logic
          const itemValue = filter.getValue 
            ? filter.getValue(item)
            : item[filter.key];

          if (Array.isArray(itemValue)) {
            // For multiselect, check if any selected value matches any item value
            return itemValue.some((val) => selectedValues.includes(String(val)));
          } else {
            // For single select, check if item value is in selected values
            return selectedValues.includes(String(itemValue));
          }
        });
      });
    }

    return result;
  }, [data, searchQuery, searchKeys, columns, filters, activeFilters]);

  const sortedData = filteredData;

  const handleFilterChange = (filterKey: string, value: string, isMultiSelect: boolean) => {
    setActiveFilters((prev) => {
      const currentValues = prev[filterKey] || [];
      
      if (isMultiSelect) {
        // Toggle value in multiselect
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterKey]: newValues };
      } else {
        // Single select - replace value
        return { ...prev, [filterKey]: value ? [value] : [] };
      }
    });
  };

  const clearFilter = (filterKey: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
  };

  const hasActiveFilters = Object.keys(activeFilters).some(
    (key) => activeFilters[key] && activeFilters[key].length > 0
  );

  return (
    <div className="w-full">
      {/* Search Bar and Filters */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          {searchable && (
            <div className="relative flex-1 w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSearchQuery(nextValue);
                  if (serverSide && onSearchChange) {
                    onSearchChange(nextValue);
                  }
                }}
                placeholder={searchPlaceholder}
                className="block w-full pl-9 pr-3 py-2 sm:py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          )}

          {/* Filters Dropdown */}
          {filters && filters.length > 0 && (
            <div className="relative sm:flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full min-w-[1.25rem] text-center">
                    {Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0)}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Content */}
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilters(false)}
                  />
                  <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4 max-h-[80vh] sm:max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Filter Options</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {filters.map((filter) => {
                      const selectedValues = activeFilters[filter.key] || [];
                      const isMultiSelect = filter.type === 'multiselect';

                      return (
                        <div key={filter.key} className="space-y-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              {filter.label}
                            </label>
                            {selectedValues.length > 0 && (
                              <button
                                onClick={() => clearFilter(filter.key)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Clear filter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                          {isMultiSelect ? (
                            <div className="flex flex-wrap gap-2">
                              {filter.options.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() => handleFilterChange(filter.key, option.value, true)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                        : 'bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="relative">
                              <select
                                value={selectedValues[0] || ''}
                                onChange={(e) => handleFilterChange(filter.key, e.target.value, false)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                              >
                                <option value="">All {filter.label}</option>
                                {filter.options.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Toggle - Mobile Only */}
      <div className="md:hidden mb-3 flex items-center justify-end">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMobileViewMode('card')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mobileViewMode === 'card'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Card view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setMobileViewMode('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mobileViewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Table view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table - Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                  </div>
                </TableHead>
              ))}
              {actions && (
                <TableHead>
                  <div className="text-right">Actions</div>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="flex flex-col items-center py-12">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="py-12 text-center">
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, index) => (
                <TableRow key={index} onClick={() => onRowClick?.(item)}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(item) : item[column.key]?.toString() || '-'}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <select
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={pagination.limit}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {pagination.page} of{' '}
                {pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / pagination.limit))}
              </span>
              <button
                type="button"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={
                  pagination.page >=
                  (pagination.totalPages ?? Math.ceil(pagination.total / pagination.limit))
                }
                className="px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Views */}
      <div className="md:hidden">
        {loading ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : mobileViewMode === 'card' ? (
          /* Card View - Mobile */
          <div className="space-y-3">
            {sortedData.map((item, index) => (
              <div
                key={index}
                onClick={() => onRowClick?.(item)}
                className={`bg-white rounded-lg shadow border border-gray-200 p-4 space-y-3 ${
                  onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
              >
                {columns.map((column, colIndex) => {
                  const isLastColumn = colIndex === columns.length - 1 && !actions;
                  return (
                    <div
                      key={column.key}
                      className={`flex flex-col gap-1 ${
                        isLastColumn ? '' : 'border-b border-gray-100 pb-3'
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column.header}
                      </div>
                      <div className={`text-sm text-gray-900 break-words ${column.className || ''}`}>
                        {column.render
                          ? column.render(item)
                          : item[column.key]?.toString() || '-'}
                      </div>
                    </div>
                  );
                })}
                {actions && (
                  <div className="pt-3 border-t border-gray-200 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {actions(item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Compact Table View - Mobile with Horizontal Scroll */
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                      </div>
                    </TableHead>
                  ))}
                  {actions && (
                    <TableHead>
                      <div className="sticky right-0 bg-white z-10 text-right">Actions</div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow key={index} onClick={() => onRowClick?.(item)}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <div className="max-w-[150px] truncate" title={item[column.key]?.toString() || '-'}>
                          {column.render
                            ? column.render(item)
                            : item[column.key]?.toString() || '-'}
                        </div>
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <div className="sticky right-0 bg-white z-10">
                          <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                            {actions(item)}
                          </div>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Swipe horizontally to see all columns
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
