export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const getPagination = (page = 1, limit = 10, maxLimit = 100): PaginationState => {
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), maxLimit) : 10;
  const skip = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    skip,
    take: safeLimit,
  };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
