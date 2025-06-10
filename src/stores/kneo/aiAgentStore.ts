import { defineStore } from 'pinia';
import { AiAgentDTO } from '../../types/kneoBroadcasterTypes';
import apiClient from "../../api/apiClient";

interface AiAgentState {
    entries: AiAgentDTO[];
    pagination: {
        page: number;
        pageSize: number;
        itemCount: number;
        pageCount: number;
    };
    loading: boolean;
    error: string | null;
}

export const useAiAgentStore = defineStore('aiAgent', {
    state: (): AiAgentState => ({
        entries: [],
        pagination: {
            page: 1,
            pageSize: 10,
            itemCount: 0,
            pageCount: 0,
        },
        loading: false,
        error: null,
    }),

    getters: {
        getEntries: (state) => state.entries,
        getPagination: (state) => state.pagination,
        isLoading: (state) => state.loading,
        getError: (state) => state.error,
    },

    actions: {
        async fetchAll(page: number = 1, pageSize: number = 10) {
            this.loading = true;
            this.error = null;
            try {
                const response = await apiClient.get('/aiagents', {
                    params: {
                        page: page,
                        size: pageSize,
                    },
                });

                const data = response.data;
                this.entries = data.content;
                this.pagination.page = data.number;
                this.pagination.pageSize = data.size;
                this.pagination.itemCount = data.totalElements;
                this.pagination.pageCount = data.totalPages;

            } catch (error: any) {
                this.error = error.message || 'Failed to fetch AI agents';
                console.error('AI Agent Store - fetchAll error:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        }
    },
});