import {Label} from "../types";

export interface Project {
    id: string;
    author: string | undefined;
    lastModifier: string | undefined;
    name: string;
    status: string;
    finishDate: string | undefined;
    manager: {
        id: string;
        name: string;
    };
    coder: {
        id: string;
        name: string;
    };
    tester: {
        id: string;
        name: string;
    };
    selected?: boolean;
    rls:[];
}

export interface Task {
    id?: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    title: string,
    regNumber: string;
    startDate: string | undefined;
    targetDate: string | undefined;
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
    title: string;
    status: number;
    priority: number;
    startDate: string | undefined;
    targetDate: string | undefined;
    project: {
        id: string;
    };
    assignee: {
        id: string;
    };
    taskType: {
        identifier: string,
    };
    labels: Label[];
    body: string;
}
