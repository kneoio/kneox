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

export interface FileInfo extends UploadFileInfo {
    id: string;
    fullPath: string;
    batchId: string;
    thumbnailUrl: string | null;
    type: string;
    percentage: number;
    status: 'pending' | 'uploading' | 'finished' | 'removed' | 'error';
}

export interface ExtendedUploadFileInfo extends UploadFileInfo {
    fileList: FileInfo[];
}

export interface Brand {
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
    uploadedFile: ExtendedUploadFileInfo | ExtendedUploadFileInfo[] | null;
}

export interface SoundFragmentSave {
    status: FragmentStatus;
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    uploadedFile: string[] | null;
}

export interface ErrorResponse {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
