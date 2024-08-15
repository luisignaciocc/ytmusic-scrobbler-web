import "react-loading-skeleton/dist/skeleton.css";

import Skeleton from "react-loading-skeleton";

function FiltersLoading() {
  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <Skeleton width={110} height={40} />
        <div className="relative w-1/3">
          <Skeleton width={480} height={40} />
        </div>
      </div>
    </div>
  );
}

export default FiltersLoading;
