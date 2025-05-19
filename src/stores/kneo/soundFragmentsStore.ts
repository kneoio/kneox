import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {SoundFragment, SoundFragmentSave} from "../../types/kneoBroadcasterTypes";

export const useSoundFragmentStore = defineStore('soundFragmentStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<SoundFragment> | null>(null);
    const apiFormResponse = ref<ApiFormResponse<SoundFragment> | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData = {
            id: '',
            slugName: '',
            author: 0,
            regDate: '',
            lastModifier: '',
            lastModifiedDate: '',
            title: '',
            status: 0,
            type: 'SONG',
            source: 'LOCAL_DISC',
            artist: '',
            genre: '',
            album: '',
            url: '',
            actionUrl: '',
            uploadedFile: null,
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

        const {viewData} = apiViewResponse.value;
        return {
            page: viewData.pageNum,
            pageSize: viewData.pageSize,
            itemCount: viewData.count,
            pageCount: viewData.maxPage,
            showSizePicker: true,
            pageSizes: [10, 20, 30, 40]
        };
    });

    const statusTypeMap: Record<number, 'error' | 'info' | 'success' | 'warning' | 'default'> = {
        0: 'default',
        100: 'info',
        101: 'warning',
        102: 'success',
        103: 'success',
        104: 'default',
        105: 'error'
    };

    const getTypeOptions = computed(() => {
        return [
            {
                label: "song",
                value: "SONG"
            },
            {
                label: "podcast",
                value: "PODCAST"
            },
            {
                label: "audiobook",
                value: "AUDIOBOOK"
            }
        ];
    });

    const genreOptions = ref([
        { label: "Crowd Rock", value: "Crowd Rock" },
        { label: "Dark Synth", value: "Dark Synth" },
        { label: "Industrial", value: "Industrial" },
        { label: "Synthwave", value: "Synthwave" },
        { label: "Alternative Rock", value: "Alternative Rock" },
        { label: "Ambient", value: "Ambient" },
        { label: "Blues", value: "Blues" },
        { label: "Chillout", value: "Chillout" },
        { label: "Classical", value: "Classical" },
        { label: "Country", value: "Country" },
        { label: "Dance", value: "Dance" },
        { label: "Downtempo", value: "Downtempo" },
        { label: "Drum and Bass", value: "Drum and Bass" },
        { label: "Dubstep", value: "Dubstep" },
        { label: "EBM", value: "EBM" },
        { label: "Electronic", value: "Electronic" },
        { label: "Electropop", value: "Electropop" },
        { label: "Experimental", value: "Experimental" },
        { label: "Folk", value: "Folk" },
        { label: "Funk", value: "Funk" },
        { label: "Futurepop", value: "Futurepop" },
        { label: "Garage Rock", value: "Garage Rock" },
        { label: "Gospel", value: "Gospel" },
        { label: "Goth Rock", value: "Goth Rock" },
        { label: "Grunge", value: "Grunge" },
        { label: "Hard Rock", value: "Hard Rock" },
        { label: "Hip Hop", value: "Hip Hop" },
        { label: "House", value: "House" },
        { label: "IDM", value: "IDM" },
        { label: "Indie Pop", value: "Indie Pop" },
        { label: "Indie Rock", value: "Indie Rock" },
        { label: "Industrial Metal", value: "Industrial Metal" },
        { label: "Instrumental", value: "Instrumental" },
        { label: "Jazz", value: "Jazz" },
        { label: "Latin", value: "Latin" },
        { label: "Lo-fi", value: "Lo-fi" },
        { label: "Metal", value: "Metal" },
        { label: "Minimal Synth", value: "Minimal Synth" },
        { label: "New Wave", value: "New Wave" },
        { label: "Noise", value: "Noise" },
        { label: "Pop", value: "Pop" },
        { label: "Post-Punk", value: "Post-Punk" },
        { label: "Progressive Rock", value: "Progressive Rock" },
        { label: "Psychedelic Rock", value: "Psychedelic Rock" },
        { label: "Punk Rock", value: "Punk Rock" },
        { label: "R&B", value: "R&B" },
        { label: "Reggae", value: "Reggae" },
        { label: "Rock", value: "Rock" },
        { label: "Shoegaze", value: "Shoegaze" },
        { label: "Ska", value: "Ska" },
        { label: "Soul", value: "Soul" },
        { label: "Soundtrack", value: "Soundtrack" },
        { label: "Spoken Word", value: "Spoken Word" },
        { label: "Techno", value: "Techno" },
        { label: "Trance", value: "Trance" },
        { label: "Trip Hop", value: "Trip Hop" },
        { label: "Vaporwave", value: "Vaporwave" },
        { label: "World Music", value: "World Music" },
        { label: "Other", value: "Other" },
    ].sort((a, b) => a.label.localeCompare(b.label)));

    const fetchSoundFragments = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/soundfragments?page=${page}&size=${pageSize}`, {});
        if (response?.data?.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchSoundFragment = async (id: string) => {
        const response = await apiClient.get(`/soundfragments/${id}`);
        if (response?.data?.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/soundfragments/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    };

    const updateCurrent = (data: SoundFragment, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: SoundFragmentSave, id?: string) => {
        const response = await apiClient.post(`/soundfragments/${id}`, data);
        if (response?.data) {
            const {docData} = response.data;
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
        fetchAll: fetchSoundFragments,
        fetch: fetchSoundFragment,
        save,
        uploadFile,
        getTypeOptions,
        genreOptions,
        getEntries,
        getPagination,
        getCurrent,
        statusTypeMap,
        updateCurrent
    };
});