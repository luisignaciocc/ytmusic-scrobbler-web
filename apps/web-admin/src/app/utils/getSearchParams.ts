const getSearchParams = (searchParams: {
  [key: string]: string | undefined;
}) => {
  const page = searchParams.page ? parseInt(searchParams.page || "1") : 1;
  const perPage = 10;

  const searchText = searchParams.searchText || "";

  let status: boolean | string = "";
  if (typeof searchParams.status !== "undefined") {
    if (searchParams.status === "true") {
      status = true;
    } else if (searchParams.status === "false") {
      status = false;
    } else {
      status = "";
    }
  } else {
    status = "";
  }

  const sortColumn = searchParams.sortColumn || "";
  const sortDirection = searchParams.sortDirection || "";

  // Enhanced filters
  const subscription = searchParams.subscription || "";
  const setup = searchParams.setup || "";
  const health = searchParams.health || "";
  const activity = searchParams.activity || "";
  const dateRange = searchParams.dateRange || "";
  const notifications = searchParams.notifications || "";

  return {
    page,
    perPage,
    searchText,
    status,
    sortColumn,
    sortDirection,
    // Enhanced filters
    subscription,
    setup,
    health,
    activity,
    dateRange,
    notifications,
  };
};

export default getSearchParams;
