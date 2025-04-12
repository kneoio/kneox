
export interface StationEntry {
    brandName: string;
}

export interface Station {
    brandName: string;
    status: string;
    segmentsSize: number;
    lastSegmentKey?: number;
    lastRequested?: number;
    currentFragment?: string;
}

export interface DashboardStats {
    totalStations: number;
    onlineStations: number;
    minimumSegments: number;
    slidingWindowSize: number;
    stations: StationEntry[];
    timelines: PeriodicTask[];
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

export interface SongStatistics {
    segmentCount: number;
    totalDuration: number;
    totalSize: number;
    averageBitrate: number;
    requestCount: number;
    start: number;
    end: number;
    latestRequestedSegment: number;
}

export interface StationDetails {
    brandName: string;
    status: string;
    managedBy: string;
    segmentsSize: number;
    playlistManagerStats: PlaylistManagerStats;
    timelines: Array<{
        task: PeriodicTask;
    }>;
    totalBytesProcessed: number;
    bitrate: number;
    queueSize: number;
    songStatistics: Record<string, SongStatistics>;
    segmentSizeHistory: number[];
}

export interface StationResponse {
    payload: {
        kneobroadcaster: string;
        station: StationDetails;
    };
}