import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Language, LanguageSave} from "../../types/officeFrameTypes";

export const useLanguageStore = defineStore('languageStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Language> | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);

    const mostUsedLanguages = [
        { label: 'Mandarin', value: 'CHN' },
        { label: 'Spanish', value: 'SPA' },
        { label: 'English', value: 'ENG' },
        { label: 'Hindi', value: 'HIN' },
        { label: 'Bengali', value: 'BEN' },
        { label: 'Portuguese', value: 'POR' },
        { label: 'Russian', value: 'RUS' },
        { label: 'Japanese', value: 'JPN' },
        { label: 'Western Punjabi', value: 'PUN' },
        { label: 'Marathi', value: 'MAR' },
        { label: 'Telugu', value: 'TEL' },
        { label: 'Wu Chinese', value: 'WUU' },
        { label: 'Turkish', value: 'TUR' },
        { label: 'Korean', value: 'KOR' },
        { label: 'French', value: 'FRE' },
        { label: 'German', value: 'GER' },
        { label: 'Vietnamese', value: 'VIE' },
        { label: 'Tamil', value: 'TAM' },
        { label: 'Yue Chinese', value: 'YUE' },
        { label: 'Urdu', value: 'URD' },
        { label: 'Javanese', value: 'JAV' },
        { label: 'Italian', value: 'ITA' },
        { label: 'Egyptian Arabic', value: 'ARA' },
        { label: 'Gujarati', value: 'GUJ' }
    ];

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData = {
            regDate: '',
            lastModifiedDate: '',
            identifier: ''
        };
        return apiFormResponse.value?.docData || defaultData;
    });

    const getPagination = computed(() => {
        if (!apiViewResponse.value) {
            return {
                page: 1,
                pageSize: 10,
                itemCount: 0,
                pageCount: 1,
                showSizePicker: true,
                pageSizes: [10, 20, 30, 40]
            };
        }

        const { viewData } = apiViewResponse.value;
        return {
            page: viewData.pageNum,
            pageSize: viewData.pageSize,
            itemCount: viewData.count,
            pageCount: viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const getOptions = computed(() => {
        return mostUsedLanguages.map(lang => ({
            label: lang.value,
            value: lang.value
        }));
    });

    const fetchPositions = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/languages?page=${page}&size=${pageSize}`);
        if (response && response.data && response.data.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchPosition = async (id: string) => {
        const response = await apiClient.get(`/languages/${id}`);
        if (response && response.data && response.data.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: Language, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: LanguageSave, id?: string) => {
        const response = await apiClient.post(`/languages/${id}`, data);
        if (response && response.data) {
            const { docData } = response.data;
            updateCurrent(docData, {});
            return docData;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        getOptions,
        fetchAll: fetchPositions,
        fetch: fetchPosition,
        save,
        getEntries,
        getPagination,
        getCurrent
    };
});