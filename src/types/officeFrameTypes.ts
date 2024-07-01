
export interface Organization {
    id?: string;  // Optional for new organizations
    identifier: string;
    bizID: string;
    localizedName: Record<string, string>;
    orgCategory: {
        localizedName: string;
    };
    status: string;
    rank: number;
    // Other properties...
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

