"use client";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationButtonsProps {
  count: number;
}

const PaginationButtons: React.FC<PaginationButtonsProps> = ({ count }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const sortColumn = searchParams.get("sortColumn") || "";
  const sortDirection = searchParams.get("sortDirection") || "";

  const searchText = searchParams.get("searchText") || "";
  const status = searchParams.get("status") || "all";

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      router.push(
        `/?page=${currentPage - 1}&searchText=${searchText}&status=${status}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`,
      );
    }
  };

  const handleNextPage = () => {
    if (currentPage * 10 < count) {
      router.push(
        `/?page=${currentPage + 1}&searchText=${searchText}&status=${status}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`,
      );
    }
  };

  return (
    <div className="flex justify-center space-x-4 my-4">
      <button
        className={`px-4 py-2 rounded-md ${
          currentPage === 1
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <button
        className={`px-4 py-2 rounded-md ${
          currentPage * 10 >= count
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
        onClick={handleNextPage}
        disabled={currentPage * 10 >= count}
      >
        Next
      </button>
    </div>
  );
};

export default PaginationButtons;
