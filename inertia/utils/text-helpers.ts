export const capitalizeFirstLetter = (str: string) => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateString = (str: string, length: number) => {
  if (!str) return str;
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};

/**
 * Sorts strings with numbers in them numerically vs. lexicographically
 * @param a - string to compare
 * @param b - string to compare
 * @returns - 0 if equal, negative if a < b, positive if a > b
 */
export const sortStringsWithNumbers = (a: string, b: string) => {
  const regex = /\d+/;
  const aMatch = a.match(regex)?.[1];
  const bMatch = b.match(regex)?.[1];
  if (!aMatch || !bMatch) return 0;
  const numA = parseInt(aMatch);
  const numB = parseInt(bMatch);
  if (numA === numB) return 0;
  return numA - numB;
};

export const minutesToPrettyHours = (minutes: number) => {
  if (!minutes) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};
