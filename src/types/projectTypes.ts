import {Label} from "../types";

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
    regNumber: string;
    project: {
        id: string;
        name: string;
    };
    assignee: {
        id: string;
        name: string;
    };
    taskType: {
        identifier: string,
        name: string
    },
    labels: Label[];
    body: string;
    status: number;
    priority: number;
    selected?: boolean;
}

export interface TaskSave {
    id?: string;
    status: number;
    priority: number;
    project: {
        id: string;
    };
    assignee: {
        id: string;
    };
    taskType: {
        identifier: string,
    };
    labels: string[];
    body: string;
}
