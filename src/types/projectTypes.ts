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
    rls:[];
}

export interface Task {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    body: string;
    status: number;
    priority: number;
    selected?: boolean;
}

export interface TaskSave {
    id?: string;
    status: number;
    priority: number;
    body: string;
}
