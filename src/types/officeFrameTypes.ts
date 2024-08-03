export interface Organization {
    id?: string;
    identifier: string;
    bizID: string;
    primary: boolean;
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
    org: {
        id: string;
        identifier: string;
        localizedName: string;
    };
    dep: {
        id: string;
        identifier: string;
        localizedName: string;
    };
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
    localizedName: Record<string, string>;
    org: {
        id: string;
    };
    dep: {
        id: string;
    };
    position: {
        id: string;
    };
    rank: number;
    phone: string;
}


export interface Language {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    code: string;
    position: number;
    localizedName: Record<string, string>;
    selected?: boolean;
}

export interface LanguageSave {
    id?: string;
    code: string;
    localizedName: Record<string, string>;
}

export interface Label {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    identifier: string;
    color: string;
    category: string;
    parent: string;
    localizedName: Record<string, string>;
    hidden: boolean;
    selected?: boolean;
}

export interface LabelSave {
    id?: string;
    identifier: string;
    color: string;
    parent: string;
    category: string;
    hidden: boolean;
    localizedName: Record<string, string>;
}


export interface OrgCategory {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    identifier: string;
    localizedName: Record<string, string>;
    selected?: boolean;
}
export interface OrgCategorySave {
    id?: string;
    identifier: string;
    localizedName: Record<string, string>;
}


export interface TaskType {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    identifier: string;
    localizedName: Record<string, string>;
    selected?: boolean;
}
export interface TaskTypeSave {
    id?: string;
    identifier: string;
    localizedName: Record<string, string>;
}


export interface Position {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    identifier: string;
    localizedName: Record<string, string>;
}

export interface PositionSave {
    id?: string;
    identifier: string;
    localizedName: Record<string, string>;
}