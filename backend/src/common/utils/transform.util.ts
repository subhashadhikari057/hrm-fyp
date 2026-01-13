export const parseBoolean = (value: unknown): boolean | unknown => {
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export const parseDate = (value: unknown): Date | unknown => {
  if (value === null || value === undefined) return value;
  if (value === '') return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
};
