import { UploadFileInfo } from "naive-ui/es/upload/src/public-types";

export enum FragmentType {
    SONG = "SONG",
    ADVERTISEMENT = "ADVERTISEMENT",
    JINGLE = "JINGLE"
}

export enum PromptType {
    SONG = "SONG",
    ADVERTISEMENT = "ADVERTISEMENT",
    REMINDER = "REMINDER"
}

export enum BrandStatus {
    OFF_LINE = "OFF_LINE",
    ON_LINE = "ON_LINE",
    QUEUE_SATURATED = "QUEUE_SATURATED",
    WARMING_UP = "WARMING_UP",
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

export enum AiAgentMode {
    BASIC = "BASIC",
    SCRIPT_FOLLOWING = "SCRIPT_FOLLOWING"
}

export enum MessageType {
    USER = "USER",
    BOT = "BOT",
    PROCESSING = "PROCESSING",
    WAITING = "WAITING",
    CHUNK = "CHUNK",
    ERROR = "ERROR"
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
    primaryVoice: string;
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
    popularityRate?: number;
    nRate?: number;
    aiAgentId?: string;
    aiOverriding?: AiOverriding;
    profileId?: string;
    profileOverriding?: ProfileOverriding;
    timeZone?: string;
    managedBy?: ManagedBy;
    aiControlAllowed?: boolean;
    submissionPolicy?: SubmissionPolicy;
    messagingPolicy?: SubmissionPolicy;
    aiAgentMode?: AiAgentMode;
    schedule?: {
        enabled: boolean;
    };
}

export interface RadioStationSave {
    localizedName: Record<string, string>;
    country: string;
    description?: string;
    color: string;
    bitRate?: number;
    popularityRate?: number;
    nRate?: number;
    aiAgentId?: string;
    aiOverriding?: AiOverriding;
    profileId?: string;
    profileOverriding?: ProfileOverriding;
    timeZone?: string;
    managedBy?: ManagedBy;
    submissionPolicy?: SubmissionPolicy;
    messagingPolicy?: SubmissionPolicy;
    aiAgentMode?: AiAgentMode;
    schedule?: any;
    scripts?: string[];
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
    length?: string | number;
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
    newlyUploaded: string[] | null;
    tempFileIds?: string[];
    length?: string;
}

export type LanguageCode = string;

export interface LanguagePreference {
    code: string;
    weight: number;
}

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
    preferredLang: LanguagePreference[];
    llmType?: string;
    searchEngineType?: string;
    primaryVoice: Voice[];
    copilot?: string;
    talkativity: number;
    podcastMode: number;
    merger?: {
        method: string;
        gainIntro: number;
    };
}

export interface AiAgentSave {
    name: string;
    preferredLang: LanguagePreference[];
    llmType?: string;
    searchEngineType?: string;
    primaryVoice: Voice[];
    copilot?: string;
    talkativity: number;
    podcastMode: number;
    merger?: {
        method: string;
        gainIntro: number;
    };
}

// Extend the base AiAgent interface to include form-specific fields
export interface AiAgentForm extends AiAgent {
    primaryVoiceId?: string;
    copilotId?: string;
    enabledTools?: any[];
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
    telegramName: string;
    country: string;
    nickName: LocalizedName;
    slugName: string;
    archived: number;
    listenerType?: string;
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
    telegramName?: string;
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
    actions?: EventAction[];
    stagePlaylist?: {
        sourcing?: string;
        searchTerm?: string;
        genres?: string[];
        labels?: string[];
        type?: string[];
        source?: string[];
        staticList?: string[];
    };
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
    actions?: EventAction[];
    stagePlaylist?: {
        sourcing?: string;
        searchTerm?: string;
        genres?: string[];
        labels?: string[];
        type?: string[];
        source?: string[];
        soundFragments?: string[];
    };
}

export interface EventAction {
    promptId?: string;
    active?: boolean;
    rank?: number;
    weight?: number;
    promptType?: PromptType | string;
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
    languageCode?: string;
    labels: string[];
    accessLevel?: number;
    scenes?: ScriptScene[];
}

export interface ScriptSave {
    name: string;
    description: string;
    languageCode?: string;
    labels: string[];
    accessLevel?: number;
    scenes?: ScriptScene[];
}

export interface ScenePromptDTO {
    promptId?: string;
    active?: boolean;
    rank?: number;
    weight?: number;
}

export interface ScriptScene {
    id?: string;
    scriptId?: string;
    type?: string;
    title?: string;
    prompts?: ScenePromptDTO[];
    startTime?: string;
    oneTimeRun?: boolean;
    weekdays?: number[];
    talkativity?: number;
    podcastMode?: number;
    author?: string;
    regDate?: string;
    lastModifier?: string;
    lastModifiedDate?: string;
    stagePlaylist?: {
        sourcing?: string;
        title?: string;
        artist?: string;
        genres?: string[];
        labels?: string[];
    };
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
    title?: string;
    prompts?: ScenePromptDTO[];
    startTime?: string;
    oneTimeRun?: boolean;
    weekdays?: number[];
    talkativity?: number;
    stagePlaylist?: {
        sourcing?: string;
        title?: string;
        artist?: string;
        genres?: string[];
        labels?: string[];
    };
}

// Prompts (Broadcaster)
export interface BroadcastPrompt {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    enabled: boolean;
    prompt: string;
    promptType?: string;
    description?: string;
    languageCode?: string;
    master?: boolean;
    locked?: boolean;
    title?: string;
    podcast?: boolean;
    version?: number;
}

export interface BroadcastPromptSave {
    enabled?: boolean;
    prompt?: string;
    promptType?: string;
    description?: string;
    languageCode?: string;
    master?: boolean;
    locked?: boolean;
    title?: string;
    podcast?: boolean;
    version?: number;
}

export interface Draft {
    id: string;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
    draftType?: string;
    title?: string;
    content?: string;
    description?: string;
    languageCode?: string;
    archived?: number;
    enabled?: boolean;
    isMaster?: boolean;
    locked?: boolean;
    version?: number;
}

export interface DraftSave {
    draftType?: string;
    title?: string;
    content?: string;
    description?: string;
    languageCode?: string;
    archived?: number;
    enabled?: boolean;
    isMaster?: boolean;
    locked?: boolean;
    localizedName?: Record<string, string>;
    version?: number;
}