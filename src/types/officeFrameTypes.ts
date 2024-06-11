export interface Organization {
    docData: {
        id: string;
        author: string;
        regDate: string;
        lastModifier: string;
        lastModifiedDate: string;
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

