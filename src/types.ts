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

export interface ViewData {
    count: number;
    pageNum: number;
    maxPage: number;
    pageSize: number;
    entries: Project[];
}

export interface Actions {
    actions: { caption: string }[];
}

export interface ViewPage {
    actions: Actions;
    viewData: ViewData;
}

export interface ProjectApiResponse {
    viewPage: ViewPage;
}

export interface Pagination {
    itemCount: number;
    page: number;
    pageCount: number;
    pageSize: number;
}
