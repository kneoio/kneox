import { UploadFileInfo } from "naive-ui/es/upload/src/public-types";

export enum FragmentType {
    SONG = "SONG"
}

export enum BrandStatus {
    OFF_LINE,
    ON_LINE,
}

export interface Profile {
    id: string;
    author?: string;
    regDate?: string;
    lastModifier?: string;
    lastModifiedDate?: string;
    name: string;
    description: string;
    explicitContent: boolean;
}

export interface ProfileSave {    
    name: string;
    description: string;
    explicitContent: boolean;
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
    iceCastUrl?: string;
    actionUrl: string;
    aiAgentId?: string;
    profileId?: string;
}

export interface RadioStationSave {
    status: BrandStatus;
    country: string;
    slugName: string;
    url: string;
    aiAgentId?: string;
    profileId?: string;
}

export interface SoundFragment {
    slugName: string;
    id: string | null;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
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
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    newlyUploaded: string[];
}

export interface Memory {
    id: string;
    author: number;
    regDate: string;
    lastModUser: number;
    lastModDate: string;
    brand: string;
    memoryType: 'LISTENERS' | 'AUDIENCE_CONTEXT' | 'CONVERSATION_HISTORY' | string;
    content: Record<string, any>;
    archived: boolean;
}

export interface MemorySave {
    brand: string;
    memoryType: string;
    content: Record<string, any>;
    archived?: boolean;
}

export type LanguageCode = string;

export interface Voice {
    id: string;
    name: string;
}

export interface Tool {
    id: string;
    name: string;
}

export interface AiAgent {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    name: string;
    preferredLang: LanguageCode;
    mainPrompt: string;
    preferredVoice: Voice[];
    enabledTools: Tool[];
}

export interface AiAgentSave {
    name: string;
    preferredLang: LanguageCode;
    mainPrompt: string;
    preferredVoice: Voice[];
    enabledTools: Tool[];
}