
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
}

export interface StationDetails {
    brandName: string;
    status: string;
    managedBy: string;
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
    statusHistory: {
        timestamp: string;
        status: string;
    }[];
}

export interface StationResponse {
    payload: {
        kneobroadcaster: string;
        station: StationDetails;
    };
}