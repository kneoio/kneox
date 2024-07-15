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

export interface Employee {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    name: string;
    localizedName: Record<string, string>;
    userId: number;
    position: {
        id: string;
        identifier: string;
        localizedName: string;
    };
    rank: number;
    phone: string;
    selected?: boolean;
}

export interface EmployeeSave {
    id?: string;
    name: string;
    localizedName: Record<string, string>;
    position: {
        id: string;
    };
    rank: number;
    phone: string;
}

export interface OrgCategory {
    id?: string;
    identifier: string;
    localizedName: Record<string, string>;
}

export interface Position {
    id?: string;
    identifier: string;
    localizedName: Record<string, string>;
}

