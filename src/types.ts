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

export interface Project {
    id: string;
    author: string | undefined;
    lastModifier: string | undefined;
    name: string;
    status: string;
    finishDate: string | undefined;
    manager: string;
    coder: string;
    tester: string | undefined;
    selected?: boolean;
}

export interface KneoGeneric {
    id: string;
    author: string | undefined;
    lastModifier: string | undefined;
}

export interface Pagination {
    itemCount: number;
    page: number;
    pageCount: number;
    pageSize: number;
}

export interface Rl {
    reader: string;
    accessLevel: string;
    key: number;
}
