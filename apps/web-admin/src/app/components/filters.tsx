"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

function Filters() {
  const router = useRouter();

  const [filterByActive, setFilterByActive] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterAndSearch = (
    newSearchQuery = "",
    newFilterByActive = filterByActive,
  ) => {
    let queryParams = "";

    queryParams += `?searchText=${newSearchQuery}`;

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
      : `?status=${statusParam}`;

    router.push(queryParams);
  };

  const handleSearch = () => {
    handleFilterAndSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    handleFilterAndSearch("");
  };

  const handleFilterChange = (newFilterValue: string) => {
    setFilterByActive(newFilterValue);
    handleFilterAndSearch(searchQuery, newFilterValue);
  };

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
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search by email or Last.fm username"
            className="w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleClearSearch}
            className="absolute top-0 z-50 right-24 h-full text-gray-500 hover:text-gray-700 focus:outline-none"
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
          <button
            onClick={handleSearch}
            className="absolute top-0 right-0 h-full px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;
