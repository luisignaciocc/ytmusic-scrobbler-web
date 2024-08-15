import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

function PaginationButtonsLoading() {
  return (
    <div className="flex justify-center space-x-4 my-4">
      <Skeleton width={90} height={40} />
      <Skeleton width={70} height={40} />
    </div>
  );
}

export default PaginationButtonsLoading;
