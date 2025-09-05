"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const sortColumn = searchParams.get("sortColumn") || "";
  const sortDirection = searchParams.get("sortDirection") || "";

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("searchText") || "",
  );
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [filterByActive, setFilterByActive] = useState(
    searchParams.get("status") || "all",
  );

  const handleFilterAndSearch = useCallback(
    (newSearchQuery = "", newFilterByActive = "all") => {
      let queryParams = "";

      queryParams += `?page=${currentPage}&searchText=${newSearchQuery}`;

      let statusParam;
      if (newFilterByActive === "active") {
        statusParam = "true";
      } else if (newFilterByActive === "inactive") {
        statusParam = "false";
      } else {
        statusParam = "";
      }

      queryParams += queryParams
        ? `&status=${statusParam}`
        : `?page=${currentPage}&status=${statusParam}`;

      router.push(
        `${queryParams}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`,
      );
    },
    [router, sortColumn, sortDirection, currentPage],
  );

  const handleClearSearch = () => {
    setSearchQuery("");
    handleFilterAndSearch("", filterByActive);
  };

  const handleFilterChange = (newFilterValue: string) => {
    setFilterByActive(newFilterValue);
    handleFilterAndSearch(debouncedSearchQuery, newFilterValue);
  };

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleFilterAndSearch(debouncedSearchQuery, filterByActive);
    }
  }, [debouncedSearchQuery, filterByActive, handleFilterAndSearch]);

  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <select
          value={filterByActive}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="relative w-1/3">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            placeholder="Search by email or Last.fm username"
            className="w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleClearSearch}
            className="absolute top-0 right-4 h-full text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;
