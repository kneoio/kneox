import { UploadFileInfo } from "naive-ui/es/upload/src/public-types";

export enum FragmentType {
    SONG = "SONG"
}

export enum FragmentStatus {
    UNDEFINED = -13, // Default state
    NOT_PROCESSED = 10, // Uploaded but not yet processed
    CONVERTED = 11, // Converted to playable format
    PLAYED = 12, // Played at least once
    ARCHIVED = 13 // Archived and no longer active
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

export interface SoundFragment {
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
    uploadedFile: ExtendedUploadFileInfo | ExtendedUploadFileInfo[] | null;
}

export interface SoundFragmentSave {
    status: FragmentStatus;
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    uploadedFile: string[] | null; // Array of file names
}

export interface ErrorResponse {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
