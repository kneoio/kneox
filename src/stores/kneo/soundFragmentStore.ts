import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient from '../../api/apiClient';
import type { ApiFormResponse, ApiViewPageResponse } from "../../types";
import type { SoundFragment, SoundFragmentSave } from "../../types/kneoBroadcasterTypes";

export const useSoundFragmentStore = defineStore('soundFragmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<SoundFragment> | null>(null);
    const availableApiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);


    const getEntries = computed(() => apiViewResponse.value?.viewData.entries || []);
    const getAvailableSoundFragments = computed(() => availableApiViewResponse.value?.viewData.entries || []);
    const getCurrent = computed(() => apiFormResponse.value?.docData || {
        id: '',
        slugName: '',
        author: '',
        regDate: '',
        lastModifier: '',
        lastModifiedDate: '',
        title: '',
        type: 'SONG',
        source: 'USERS_UPLOAD',
        artist: '',
        genre: '',
        album: '',
        url: '',
        actionUrl: '',
        uploadedFiles: [],
    });

    const getPagination = computed(() => {
        if (!apiViewResponse.value) return {
            page: 1,
            pageSize: 10,
            itemCount: 0,
            pageCount: 1,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };

        return {
            page: apiViewResponse.value.viewData.pageNum,
            pageSize: apiViewResponse.value.viewData.pageSize,
            itemCount: apiViewResponse.value.viewData.count,
            pageCount: apiViewResponse.value.viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const getAvailablePagination = computed(() => {
        if (!availableApiViewResponse.value?.viewData) return {
            page: 1,
            pageSize: 10,
            itemCount: 0,
            pageCount: 1,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };

        return {
            page: availableApiViewResponse.value.viewData.pageNum,
            pageSize: availableApiViewResponse.value.viewData.pageSize,
            itemCount: availableApiViewResponse.value.viewData.count,
            pageCount: availableApiViewResponse.value.viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const fetchSoundFragments = async (page = 1, pageSize = 10, searchQuery = '') => {
        let url = `/soundfragments?page=${page}&size=${pageSize}`;
        if (searchQuery) {
            url = `/soundfragments/search?q=${encodeURIComponent(searchQuery)}&page=${page}&size=${pageSize}`;
        }
        const response = await apiClient.get(url);
        if (!response?.data?.payload) throw new Error('Invalid API response for sound fragments');
        apiViewResponse.value = response.data.payload;
    };

    const fetchAvailableSoundFragments = async (brand: string, page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/soundfragments/available-soundfragments?brand=${brand}&page=${page}&size=${pageSize}`);
        if (!response?.data?.payload?.viewData?.entries) throw new Error('Invalid API response structure for available sound fragments');

        const rawPayload = response.data.payload;
        const transformedEntries = rawPayload.viewData.entries.map((entry: any) => entry.soundfragment);

        availableApiViewResponse.value = {
            ...rawPayload,
            viewData: {
                ...rawPayload.viewData,
                entries: transformedEntries,
            },
        };
    };

    const fetchSoundFragment = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}`);
        if (!response?.data?.payload) throw new Error('Invalid API response');
        apiFormResponse.value = response.data.payload;
    };

    const uploadFile = async (id: string, file: File) => {
        const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    
        if (file.size > maxSizeBytes) {
            throw new Error(`File too large. Maximum size is ${maxSizeBytes / 1024 / 1024}MB`);
        }
    
        const formData = new FormData();
        formData.append('file', file);
    
        try {
            const response = await apiClient.post('/soundfragments/files/' + id, formData, {
                timeout: 600000, // 10 minutes
                maxContentLength: 120 * 1024 * 1024,
                maxBodyLength: 120 * 1024 * 1024,
            });
    
            return response.data;
            
        } catch (error: any) {
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
    
                switch (status) {
                    case 413:
                        throw new Error('File size exceeds server limits. Please choose a smaller file.');
                    case 415:
                        throw new Error('Unsupported file type. Only audio files are allowed.');
                    case 400:
                        const message = typeof errorData === 'string' ? errorData :
                            (errorData?.error?.message || errorData?.message || 'Invalid file upload request');
                        throw new Error(message);
                    case 403:
                        throw new Error('You do not have permission to upload files');
                    case 500:
                        throw new Error('Server error occurred during upload. Please try again.');
                    default:
                        throw new Error(`Upload failed: ${errorData?.error?.message || errorData?.message || `HTTP ${status}`}`);
                }
            } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Upload timeout. Please try with a smaller file or check your connection.');
            } else if (error.message.includes('Network Error')) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const updateCurrent = (data: SoundFragment, actions: any = {}) => {
        apiFormResponse.value = { docData: data, actions };
    };

    const save = async (data: SoundFragmentSave, id: string | null) => {
        const response = await apiClient.post(`/soundfragments/${id || ''}`, data);
        if (!response?.data) throw new Error('Invalid API response');
        apiFormResponse.value = response.data;
        return apiFormResponse.value;
    };

    const downloadFile = async (url: string, fileName?: string) => {
        try {
            const response = await apiClient.get(url, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream'
            });
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || url.split('/').pop()?.split('?')[0] || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            return response;
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    };

    const deleteSoundFragment = async (id: string) => {
        await apiClient.delete(`/soundfragments/${id}`);
    };

    const fetchAccessList = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}/access`);
        if (!response?.data) throw new Error('Invalid API response');
        return response.data;
    };

    const pollUploadProgress = async (uploadId: string, onProgress: (percentage: number) => void): Promise<any> => {
        return new Promise((resolve, reject) => {
            let pollCount = 0;
            let consecutiveErrors = 0;
            let currentInterval = 200;
            let timeoutId: NodeJS.Timeout | null = null;
            let overallTimeoutId: NodeJS.Timeout;
            
            const progressHistory: Array<{ percentage: number; timestamp: number }> = [];
            const maxHistorySize = 10;
            
            console.log('Starting dynamic polling system...');
            
            const calculateProgressSpeed = (): number => {
                if (progressHistory.length < 2) return 0;
                
                const recent = progressHistory.slice(-5);
                if (recent.length < 2) return 0;
                
                const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
                const progressSpan = recent[recent.length - 1].percentage - recent[0].percentage;
                
                return timeSpan > 0 ? progressSpan / timeSpan : 0;
            };
            
            const adjustInterval = (latency: number, progressSpeed: number): void => {
                let newInterval = currentInterval;
                
                if (progressSpeed > 20) {
                    newInterval = 100;
                } else if (progressSpeed > 5) {
                    newInterval = 300;
                } else if (progressSpeed > 1) {
                    newInterval = 800;
                } else if (progressSpeed > 0) {
                    newInterval = 2000;
                } else {
                    newInterval = Math.min(currentInterval * 1.2, 2000);
                }
                
                if (latency > 1000) {
                    newInterval = Math.min(newInterval * 1.3, 2000);
                } else if (latency < 100) {
                    newInterval = Math.max(newInterval * 0.8, 100);
                }
                
                const maxChange = currentInterval * 0.5;
                newInterval = Math.max(currentInterval - maxChange, Math.min(currentInterval + maxChange, newInterval));
                newInterval = Math.max(100, Math.min(2000, Math.round(newInterval)));
                
                if (Math.abs(newInterval - currentInterval) > 10) {
                    console.log(`Adjusting poll interval: ${currentInterval}ms → ${newInterval}ms`);
                    if (progressSpeed > 20) {
                        console.log('High progress speed detected, optimizing polling frequency');
                    } else if (latency > 1000) {
                        console.log('High latency detected, reducing polling frequency');
                    } else if (progressSpeed < 1) {
                        console.log('Slow progress detected, reducing polling frequency');
                    }
                }
                
                currentInterval = newInterval;
            };
            
            const scheduleNextPoll = (): void => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                timeoutId = setTimeout(poll, currentInterval);
            };
            
            const poll = async (): Promise<void> => {
                const startTime = Date.now();
                
                try {
                    pollCount++;
                    
                    const progressResponse = await apiClient.get(`/soundfragments/upload-progress/${uploadId}`);
                    const progress = progressResponse.data;
                    const latency = Date.now() - startTime;
                    
                    console.log(`Poll #${pollCount} (interval: ${currentInterval}ms) completed in ${latency}ms: ${progress.percentage}% - ${progress.status}`);
                    
                    consecutiveErrors = 0;
                    
                    progressHistory.push({ percentage: progress.percentage, timestamp: Date.now() });
                    if (progressHistory.length > maxHistorySize) {
                        progressHistory.shift();
                    }
                    
                    const progressSpeed = calculateProgressSpeed();
                    if (progressSpeed > 0 && progressHistory.length >= 3) {
                        console.log(`Progress speed: ${progressSpeed.toFixed(2)}% per second`);
                    }
                    
                    onProgress(progress.percentage);
                    
                    if (progress.status === 'finished') {
                        if (timeoutId) clearTimeout(timeoutId);
                        if (overallTimeoutId) clearTimeout(overallTimeoutId);
                        console.log(`Upload completed after ${pollCount} polls`);
                        resolve(progress);
                        return;
                    } else if (progress.status === 'error') {
                        if (timeoutId) clearTimeout(timeoutId);
                        if (overallTimeoutId) clearTimeout(overallTimeoutId);
                        console.error(`Upload failed after ${pollCount} polls`);
                        reject(new Error('Upload processing failed on server'));
                        return;
                    }
                    
                    adjustInterval(latency, progressSpeed);
                    scheduleNextPoll();
                    
                } catch (error: any) {
                    consecutiveErrors++;
                    const latency = Date.now() - startTime;
                    
                    console.error(`Progress polling failed on poll #${pollCount}:`, error);
                    
                    if (error.response?.status === 404) {
                        if (pollCount <= 5) {
                            console.log('Upload session not found yet, reducing frequency...');
                            currentInterval = Math.min(currentInterval * 1.5, 2000);
                            scheduleNextPoll();
                            return;
                        }
                    } else if (error.response?.status >= 500) {
                        if (consecutiveErrors <= 3) {
                            const backoffDelay = Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 5000);
                            console.log(`Server error, exponential backoff: ${backoffDelay}ms (attempt ${consecutiveErrors}/3)`);
                            currentInterval = backoffDelay;
                            scheduleNextPoll();
                            return;
                        }
                    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                        console.log('Network error detected, increasing interval by 50%');
                        currentInterval = Math.min(currentInterval * 1.5, 2000);
                        if (consecutiveErrors <= 3) {
                            scheduleNextPoll();
                            return;
                        }
                    }
                    
                    if (timeoutId) clearTimeout(timeoutId);
                    if (overallTimeoutId) clearTimeout(overallTimeoutId);
                    console.error(`Progress polling failed permanently after ${pollCount} polls`);
                    reject(error);
                }
            };
            
            overallTimeoutId = setTimeout(() => {
                if (timeoutId) clearTimeout(timeoutId);
                console.error(`Upload timeout after ${pollCount} polls`);
                reject(new Error('Upload processing timeout'));
            }, 10 * 60 * 1000);
            
            poll();
        });
    };


    return {
        apiViewResponse,
        apiFormResponse,
        availableApiViewResponse,
        getEntries,
        getAvailableSoundFragments,
        getCurrent,
        getPagination,
        getAvailablePagination,
        fetchAll: fetchSoundFragments,
        fetchAvailable: fetchAvailableSoundFragments,
        fetch: fetchSoundFragment,
        save,
        delete: deleteSoundFragment,
        uploadFile,
        pollUploadProgress,
        updateCurrent,
        downloadFile,
        fetchAccessList
    };
});