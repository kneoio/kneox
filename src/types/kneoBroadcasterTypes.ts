import { UploadFileInfo } from "naive-ui/es/upload/src/public-types";

export enum FragmentType {
    SONG = "SONG"
}

export enum BrandStatus {
    OFF_LINE,
    ON_LINE,
}

export enum FragmentStatus {
    UNDEFINED = -13,
    NOT_PROCESSED = 10,
    CONVERTED = 11,
    PLAYED = 12,
    ARCHIVED = 13
}

export interface RadioStation {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    status: BrandStatus;
    country: string;
    slugName: string;
    url: string;
}

export interface RadioStationSave {
    status: BrandStatus;
    country: string;
    slugName: string;
    url: string;
}

export interface SoundFragment {
    slugName: string;
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    status: FragmentStatus;
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    url: string;
    actionUrl: string;
    uploadedFiles: UploadFileInfo[];
}

export interface SoundFragmentSave {
    status: FragmentStatus;
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    newlyUploaded: string[];
}
