import "react-loading-skeleton/dist/skeleton.css";

import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";

export default function UsersTableLoading() {
  return (
    <Fragment>
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-2">
              <Skeleton width={65} height={20} />
            </th>
            <th className="px-2 py-2">
              <div className="flex">
                <Skeleton width={60} height={20} />
              </div>
            </th>
            <th className="px-2 py-2">
              <div className="flex">
                <Skeleton width={150} height={20} />
              </div>
            </th>
            <th className="px-2 py-2">
              <div className="flex">
                <Skeleton width={80} height={20} />
              </div>
            </th>
            <th className="px-2 py-2">
              <div className="flex">
                <Skeleton width={200} height={20} />
              </div>
            </th>
            <th className="px-2 py-2">
              <div className="flex">
                <Skeleton width={100} height={20} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, index) => (
            <tr key={index} className="border-b">
              <td className="px-2 py-2">
                <Skeleton width={40} height={40} circle />
              </td>
              <td className="px-2 py-2">
                <Skeleton width={350} height={20} />
              </td>
              <td className="px-2 py-2">
                <Skeleton width={120} height={20} />
              </td>
              <td className="px-2 py-2">
                <Skeleton width={25} height={25} />
              </td>
              <td className="px-2 py-2">
                <Skeleton width={150} height={20} />
              </td>
              <td className="px-2 py-2">
                <Skeleton width={150} height={20} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Fragment>
  );
}
