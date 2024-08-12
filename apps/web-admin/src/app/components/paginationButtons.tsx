"use client";
import { useRouter } from "next/navigation";

interface PaginationButtonsProps {
  count: number;
  currentPage: number;
}

const PaginationButtons: React.FC<PaginationButtonsProps> = ({
  count,
  currentPage,
}) => {
  const router = useRouter();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      router.push(`/?page=${currentPage - 1}`);
    }
  };

  const handleNextPage = () => {
    if (currentPage * 10 < count) {
      router.push(`/?page=${currentPage + 1}`);
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
