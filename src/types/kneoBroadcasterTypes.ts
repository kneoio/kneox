import { UploadFileInfo } from "naive-ui/es/upload/src/public-types";

export enum FragmentType {
    SONG = "SONG"
}

export enum BrandStatus {
    OFF_LINE = "OFF_LINE",
    ON_LINE = "ON_LINE",  
    QUEUE_SATURATED = "QUEUE_SATURATED",
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

export enum SubmissionPolicy {
    NOT_ALLOWED = "NOT_ALLOWED",
    REVIEW_REQUIRED = "REVIEW_REQUIRED",
    NO_RESTRICTIONS = "NO_RESTRICTIONS"
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

export interface ProfileOverriding {
    name: string;
    description: string;
}

export interface AiOverriding {
    name: string;
    prompt: string;
    talkativity: number;
    preferredVoice: string;
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
    mp3Url?: string;
    mixplaUrl?: string;
    actionUrl: string;
    bitRate?: number;
    aiAgentId?: string;
    aiOverriding?: AiOverriding;
    profileId?: string;
    profileOverriding?: ProfileOverriding;
    timeZone?: string;
    managedBy?: ManagedBy;
    aiControlAllowed?: boolean;
    submissionPolicy?: SubmissionPolicy;
    messagingPolicy?: SubmissionPolicy;
    schedule?: {
        enabled: boolean;
    };
}

export interface RadioStationSave {
    localizedName: Record<string, string>;
    country: string;
    description: string;
    color: string;
    bitRate?: number;
    aiAgentId?: string;
    aiOverriding?: AiOverriding;
    profileId?: string;
    profileOverriding?: ProfileOverriding;
    timeZone?: string;
    managedBy?: ManagedBy;
    submissionPolicy?: SubmissionPolicy;
    messagingPolicy?: SubmissionPolicy;
    schedule?: any;
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
    genres: string[];
    labels?: string[];
    album?: string;
    url: string;
    description: string;
    actionUrl: string;
    defaultBrandId: string;
    representedInBrands: string[];
    uploadedFiles: UploadFileInfo[];
    source?: string;
}

export interface SoundFragmentSave {
    type: FragmentType;
    title?: string;
    artist?: string;
    genres: string[];
    labels?: string[];
    album?: string;
    description: string;
    representedInBrands: string[];
    newlyUploaded: string[];
    tempFileIds?: string[];
}

export interface Memory {
    id: string;
    author: number;
    regDate: string;
    lastModUser: number;
    lastModifiedDate: string;
    brand: string;
    color?: string;
    memoryType: 'LISTENERS' | 'AUDIENCE_CONTEXT' | 'CONVERSATION_HISTORY' | string;
    content: Record<string, any>;
    archived: boolean;
}

export interface MemorySave {
    brand: string;
    color?: string;
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

export interface Prompt {
    enabled: boolean;
    prompt: string;
}

export interface AiAgent {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    name: string;
    preferredLang: LanguageCode;
    llmType?: string;
    prompts: Prompt[];
    fillerPrompt: string[];
    messagePrompts?: string[];
    miniPodcastPrompts?: string[];
    preferredVoice: Voice[];
    copilot?: string;
    enabledTools: Tool[];
    talkativity: number;
    podcastMode: number;
    merger?: {
        method: string;
        gainIntro: number;
    };
}

export interface AiAgentSave {
    name: string;
    preferredLang: LanguageCode;
    llmType?: string;
    prompts: Prompt[];
    fillerPrompt?: string[];
    messagePrompts?: string[];
    miniPodcastPrompts?: string[];
    preferredVoice: Voice[];
    copilot?: string;
    enabledTools: Tool[];
    talkativity: number;
    podcastMode: number;
    merger?: {
        method: string;
        gainIntro: number;
    };
}

// Extend the base AiAgent interface to include form-specific fields
export interface AiAgentForm extends AiAgent {
    preferredVoiceId?: string;
    copilotId?: string;
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
  userId?: number;
  listenerOf?: string[];
}

export interface Event {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    brandId: string;
    timeZone?: string;
    type: string;
    description: string;
    priority: string;
}

export interface EventViewData {
    count: number;
    pageNum: number;
    maxPage: number;
    pageSize: number;
    entries: Event[];
}

export interface EventSave {
    brandId?: string;
    timeZone?: string;
    type: string;
    description: string;
    priority?: string;
    schedule?: {
        enabled?: boolean;
        timeZone?: string;
        tasks?: any[];
    };
}

export interface SubmissionPayload {
    brand: string;
    artist: string;
    title: string;
    genres: string[];
    email: string;
    description: string;
    uploadId?: string;
    newlyUploaded?: string[];
    confirmationCode?: string;
    album?: string;
    representedInBrands?: string[];
    contributorEmail?: string;
    isShareable?: boolean;
    attachedMessage?: string;
    country?: string; 
    agreedAt?: string;
    termsText?: string;
    agreementVersion?: string;
}

export interface Script {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    name: string;
    description: string;
    labels: string[];
}

export interface ScriptSave {
    name: string;
    description: string;
    labels: string[];
}

// Script Scenes
export interface ScriptScene {
id?: string;
scriptId?: string;
type?: string;
prompts?: string[];
startTime?: string;
}

export interface ScriptSceneViewData {
count: number;
pageNum: number;
maxPage: number;
pageSize: number;
entries: ScriptScene[];
}

export interface ScriptSceneSave {
type?: string;
prompts?: string[];
startTime?: string;
}