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
    id: string | null;
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

export type LanguageCode = string; // e.g., 'en', 'pt', 'es'

export interface VoiceDTO {
    id: string; // Assuming an ID for Voice, adjust if it's just a name
    name: string;
    // Add other relevant properties of a VoiceDTO here if needed
}

export interface ToolDTO {
    id: string; // Assuming an ID for Tool, adjust if it's just a name
    name: string;
    // Add other relevant properties of a ToolDTO here if needed
}

export interface AiAgentDTO {
    id: string; // Assuming inherited from AbstractDTO
    author: string; // Assuming inherited from AbstractDTO
    regDate: string; // Assuming inherited from AbstractDTO
    lastModifier: string; // Assuming inherited from AbstractDTO
    lastModifiedDate: string; // Assuming inherited from AbstractDTO
    name: string;
    preferredLang: LanguageCode;
    mainPrompt: string;
    preferredVoice: VoiceDTO[];
    enabledTools: ToolDTO[];
}