
export enum PlaylistItemType {
    SONG = 'SONG',
    MIX_INTRO_SONG = 'MIX_INTRO_SONG',
    MIX_1_INTRO_FADED_SONG = 'MIX_1_INTRO_FADED_SONG',
    MIX_2_SONG = 'MIX_2_SONG',
    MIX_SONG_1_SONG_2 = 'MIX_SONG_1_SONG_2',
    MIX_1_SONG = 'MIX_1_SONG',
    MIX_2_INTRO_SONG = 'MIX_2_INTRO_SONG',
    MIX_DJ_CUSTOM_INTRO_SONG = 'MIX_DJ_CUSTOM_INTRO_SONG'
}

export interface StationEntry {
    brandName: string;
    status: string;
}

export interface Station {
    brandName: string;
    status: string;
    segmentsSize: number;
    lastSegmentKey?: number;
    lastRequested?: number;
    currentFragment?: string;
}

export interface ConfigDetails {
    configDetails: Record<string, string>;
}

export interface FileMaintenanceStats {
    totalSpaceBytes: number;
    availableSpaceBytes: number;
    spaceFreedBytes: number;
    filesDeleted: number;
    directoriesDeleted: number;
}

export interface SchedulerExecution {
    scheduledTime: string;
}

export interface SchedulerTask {
    entityId: string;
    entityType: string;
    entityName: string;
    taskType: string;
    triggerType: string;
    status: string;
    timeZone: string;
    nextExecution: string | null;
    lastExecution: string | null;
    cronExpression: string | null;
    upcomingExecutions: SchedulerExecution[];
    enabled: boolean;
}

export interface SchedulerStats {
    schedulerRunning: boolean;
    schedulerName: string;
    totalScheduledTasks: number;
    activeJobs: number;
    pausedJobs: number;
    completedJobs: number;
    errorJobs: number;
    jobGroups: string[];
    tasks: SchedulerTask[];
    lastUpdated: string;
}

export interface DashboardStats {
    totalStations: number;
    onlineStations: number;
    warmingStations: number;
    offlineStations: number;
    minimumSegments: number;
    slidingWindowSize: number;
    stations: StationEntry[];
    timelines: PeriodicTask[];
    configurationStats: ConfigDetails;
    fileMaintenanceStats: FileMaintenanceStats;
    schedulerStats: SchedulerStats;
}

export interface PeriodicTask {
    id: string;
    name: string;
    startTime?: string;
    schedulerName?: string;
    lastExecutionTime: string;
    nextExecutionTime: string;
    timeRemaining: number;
    currentProgress: number;
    intervalSeconds?: number;
    executionCount?: number;
}

export interface DashboardResponse {
    payload: {
        kneobroadcaster: string;
        stats: DashboardStats;
    };
}

export interface PlaylistManagerStats {
    obtainedByPlaylist: string[];
    readyToBeConsumed: string[];
    brand: string;
    livePlaylist?: Array<{
        title?: string;
        artist?: string;
        source?: string;
        obtained?: boolean;
        itemType?: string;
    }>;
    playedSongs?: Array<{
        title?: string;
        artist?: string;
        source?: string;
        obtained?: boolean;
        itemType?: string;
        duration?: number;
    }>;
}

export interface AiDjStats {
    lastRequestTime: string;
    djName: string;
    messages?: Array<{
        type: string;
        message: string;
    }>;
}

export interface CountryStats {
    countryCode: string;
    accessCount: number;
}

export interface StationDetails {
    brandName: string;
    status: string;
    managedBy: string;
    realTime?: string;
    zoneId?: string;
    segmentsSize: number;
    playlistManagerStats: PlaylistManagerStats;
    timeline: {
        pastSegmentSequences: number[];
        visibleSegmentSequences: number[];
        upcomingSegmentSequences: number[];
    } | null;
    totalBytesProcessed: number;
    bitrate: number;
    queueSize: number;
    songStatistics: {
        title: string;
        segmentTimestamp: number;
        requestCount: number;
    } | null;
    segmentSizeHistory: number[];
    currentListeners: number;
    listenersByCountry: CountryStats[];
    statusHistory: {
        timestamp: string;
        status: string;
    }[];
    schedule: {
        createdAt: string;
        entries: Array<{
            sceneId: string;
            sceneTitle: string;
            startTime: string;
            endTime: string;
            active: boolean;
            sourcing: string;
            searchInfo?: string | null;
            playlistTitle?: string | null;
            artist?: string | null;
            searchTerm?: string | null;
            songsCount: number;
            fetchedSongsCount: number;
            generatedSoundFragmentId: string | null;
            actualStartTime: string | null;
            actualEndTime: string | null;
            status: string;
            timingOffsetSeconds: number | null;
            generatedFragmentId: string | null;
            generatedContentTimestamp: string | null;
            generatedContentStatus: string | null;
            songs: Array<{
                songId: string;
                title: string;
                artist: string;
                scheduledStartTime: string;
            }>;
        }>;
    };
    runningTasks?: Array<{
        taskType: string;
        target: string;
        startTime: string;
    }>;
    heartbeat?: boolean;
    aiDjStats?: AiDjStats;
}

export interface StationResponse {
    payload: {
        kneobroadcaster: string;
        station: StationDetails;
    };
}