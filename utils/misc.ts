export const getPaginationOffset = (page: number, limit: number) => {
  if (page <= 1) return 0;
  return (page - 1) * limit;
};
