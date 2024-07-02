
export interface Organization {
    id?: string;
    identifier: string;
    bizID: string;
    localizedName: Record<string, string>;
    orgCategory: {
        id: string;
        identifier: string;
        localizedName: string;
    };
    status: string;
    rank: number;
}

export interface OrganizationSave {
    identifier: string;
    bizID: string;
    localizedName: Record<string, string>;
    orgCategory: {
        id: string;
    };
    rank: number;
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

