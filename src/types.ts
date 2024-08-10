// API Response related types
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

export interface Label {
    id: string;
    identifier: string;
    hidden: boolean;
    color: string;
}


export interface Actions {
    actions: {
        caption: string;
        hint: string;
        actions: string[];
    }
}

export interface KneoGeneric {
    id: string;
    author: string | undefined;
    lastModifier: string | undefined;
}

export interface Rl {
    reader: string;
    accessLevel: string;
    key: number;
}
