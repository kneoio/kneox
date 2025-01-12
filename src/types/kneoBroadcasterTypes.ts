export enum FragmentType {
    SONG = "SONG"
}

export enum FragmentStatus {
    UNDEFINED = -13,
    NOT_PROCESSED = 10,
    CONVERTED = 11,
    PLAYED = 12,
    ARCHIVED = 13
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
    uploadedFile:  File | null;
}

export interface SoundFragmentSave {
    status: FragmentStatus;
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    uploadedFile:  File | null;
}