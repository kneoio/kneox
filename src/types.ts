export interface ApiFormResponse {
    docData: Record<string, any>;
    actions: any[];
}

export interface ApiViewPageResponse<T = any> {
    actions: { caption: string }[];
    viewData: ViewData<T>;
}

export interface ViewData<T = any> {
    count: number;
    pageNum: number;
    maxPage: number;
    pageSize: number;
    entries: T[];
}

export interface KneoGeneric {
    id: string;
    author: string | undefined;
    lastModifier: string | undefined;
}

export  interface PaginationInfo {
    startIndex: number
    endIndex: number
    page: number
    pageSize: number
    pageCount: number
    itemCount: number | undefined
}

export interface Rl {
    reader: string;
    accessLevel: string;
    key: number;
}
