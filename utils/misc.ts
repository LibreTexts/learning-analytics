export const getPaginationOffset = (page: number, limit: number) => {
  if (page <= 1) return 0;
  return (page - 1) * limit;
};

export const debugADP = (msg: string) => {
  console.log(`[ADP]: ${msg}`);
};

export const queryObjFromSearchParams = (searchParams: URLSearchParams) => {
  const queryObj: { [key: string]: string } = {};
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });
  return queryObj;
};

export const DEFAULT_DATE_FORMAT = "MM/dd/yyyy hh:mm a";
export const DATE_ONLY_FORMAT = "MM/dd/yyyy";
