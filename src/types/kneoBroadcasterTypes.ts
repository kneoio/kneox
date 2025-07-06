import { UploadFileInfo } from "naive-ui/es/upload/src/public-types";

export enum FragmentType {
    SONG = "SONG"
}

export enum BrandStatus {
    OFF_LINE = "OFF_LINE",
    ON_LINE = "ON_LINE",
    ON_LINE_WELL = "ON_LINE_WELL",
    WARMING_UP = "WARMING_UP",
    WAITING_FOR_CURATOR = "WAITING_FOR_CURATOR",
    IDLE = "IDLE",
    SYSTEM_ERROR = "SYSTEM_ERROR",
}

export enum ManagedBy {
    ITSELF = "ITSELF",
    AI_AGENT = "AI_AGENT",
    MIX = "MIX"
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
    title: string;
    localizedName: Record<string, string>;
    country: string;
    description: string;
    color: string;
    slugName: string;
    url: string;
    hlsUrl: string;
    iceCastUrl?: string;
    mixplaUrl?: string;
    actionUrl: string;
    aiAgentId?: string;
    profileId?: string;
    timeZone?: string;
    managedBy?: ManagedBy;
}

export interface RadioStationSave {
    localizedName: Record<string, string>;
    country: string;
    description: string;
    color: string;
    aiAgentId?: string;
    profileId?: string;
    timeZone?: string;
    managedBy?: ManagedBy;
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
    defaultBrandId: string;
    representedInBrands: string[];
    uploadedFiles: UploadFileInfo[];
}

export interface SoundFragmentSave {
    type: FragmentType;
    title?: string;
    artist?: string;
    genre?: string;
    album?: string;
    representedInBrands: string[];
    newlyUploaded: string[];
    tempFileIds?: string[];
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
    fillerPrompt: string[];
    preferredVoice: Voice[];
    enabledTools: Tool[];
    talkativity: number;
}

export interface AiAgentSave {
    name: string;
    preferredLang: LanguageCode;
    mainPrompt: string;
    fillerPrompt: string[];
    preferredVoice: Voice[];
    enabledTools: Tool[];
    talkativity: number;
}

// Types for Listeners Feature

export interface LocalizedName {
  [key: string]: string;
}

export interface ListenerEntry {
  id: string;
  author: string;
  regDate: string;
  lastModifier: string;
  lastModifiedDate: string;
  localizedName: LocalizedName;
  userId: number;
  country: string;
  nickName: LocalizedName;
  slugName: string;
  archived: number;
}

export interface ListenerViewData {
  count: number;
  pageNum: number;
  maxPage: number;
  pageSize: number;
  entries: ListenerEntry[];
}

export interface ListenerSave {
  localizedName?: LocalizedName;
  nickName?: LocalizedName;
  country?: string;
  slugName?: string;
  archived?: number;
  userId?: number; // Assuming userId might be set on creation or editable
  listenerOf?: string[]; // Array of radio station IDs this listener is associated with
}