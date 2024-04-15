export const capitalizeFirstLetter = (str: string) => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateString = (str: string, length: number) => {
  if (!str) return str;
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};
