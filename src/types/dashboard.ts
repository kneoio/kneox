// types/dashboard.ts
export interface Station {
    brandName: string;
    status: string;
    segmentsSize: number;
    lastSegmentKey: number;
    lastRequested: number;
    currentFragment: string;
    segmentSizeHistory?: number[]; // Added to match your usage
    bitrate?: number; // Added to match your usage
    recentlyPlayed?: string[]; // Added to match your usage
}

export interface DashboardStats {
    totalStations: number;
    onlineStations: number;
    minimumSegments: number;
    slidingWindowSize: number;
    stations: Record<string, Station>;
    timelines: PeriodicTask[];
}

export interface PeriodicTask {
    name: string;
    schedulerName: string;
    lastExecutionTime: string;
    nextExecutionTime: string;
    timeRemaining: number;
    currentProgress: number;
}

export interface DashboardResponse {
    payload: {
        kneobroadcaster: string[];
        stats: DashboardStats;
    };
}

export interface DashboardStore {
    response: DashboardResponse | null;
    isConnected: boolean;
    lastUpdate: Date | null;
    stats: DashboardStats;
    stationsList: Station[];
    version: string;
    connect: () => void;
    disconnect: () => void;
    fetchDashboard: () => void;
    setupPeriodicRefresh: (intervalMs?: number) => () => void;
}