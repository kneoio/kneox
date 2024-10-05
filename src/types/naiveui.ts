export type RowKey = string | number;

export interface PaginationInfo {
    startIndex: number;
    endIndex: number;
    page: number;
    pageSize: number;
    pageCount: number;
    itemCount: number | undefined;
}
