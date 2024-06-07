// types.ts
export interface EmployerEntry {
    id: string;
    name: string;
    userId: number;
    // other properties if needed
}

export interface ViewPage {
    viewData: {
        count: number;
        pageNum: number;
        maxPage: number;
        pageSize: number;
        entries: EmployerEntry[];
    };
}


export interface Employer {
    docData: {
        id: string;
        author: string;
        regDate: string;
        lastModifier: string;
        lastModifiedDate: string;
        name: string;
        userId: number;
        position: {};
        rank: number;
        phone: string;
    };
}

