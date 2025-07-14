// src/stores/kneo/profileStore.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import apiClient, { setupApiClient } from '../../api/apiClient';
import { ApiFormResponse, ApiViewPageResponse } from "../../types";
import { ProfileSave } from '../../types/kneoBroadcasterTypes';
import { useReferencesStore } from './referencesStore';

export interface Genre {
    id: string;
    name: string;
}

export interface ProfileDTO {
    id: string;
    name: string;
    description: string;
    allowedGenres: Genre[];
    explicitContent: boolean;
    author: string;
    regDate: string;
    lastModifier: string;
    lastModifiedDate: string;
}

export const useProfileStore = defineStore( 'profileStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<ProfileDTO> | null>( null );
    const apiFormResponse = ref<ApiFormResponse<ProfileDTO> | null>( null );

    const getEntries = computed( () => {
        return apiViewResponse.value?.viewData.entries || [];
    } );

    const getCurrent = computed( () => {
        const defaultData: ProfileDTO = {
            id: '',
            name: '',
            description: '',
            allowedGenres: [],
            explicitContent: false,
            author: '',
            regDate: '',
            lastModifier: '',
            lastModifiedDate: ''
        };

        return apiFormResponse.value?.docData || defaultData;
    } );

    const getPagination = computed( () => {
        if ( !apiViewResponse.value ) {
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
    } );

    const fetchProfiles = async ( page = 1, pageSize = 10 ) => {
        const response = await apiClient.get( `/profiles?page=${page}&size=${pageSize}` );
        if ( response?.data?.payload ) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error( 'Invalid API response structure' );
        }
    };

    const fetchProfilesUnsecured = async ( page = 1, pageSize = 100 ) => {
        const referencesStore = useReferencesStore();
        const payload = await referencesStore.fetchDictionary('profiles', page, pageSize);
        apiViewResponse.value = payload;
    };

    const fetchProfile = async ( id: string ) => {
        const response = await apiClient.get( `/profiles/${id}` );
        if ( response?.data?.payload ) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error( 'Invalid API response structure' );
        }
    };

    const updateCurrent = ( data: ProfileDTO, actions: any = {} ) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };


    const save = async ( data: ProfileSave, id: string | null ) => {
        const response = await apiClient.post( `/profiles/${id || ''}`, data );
        if ( !response?.data ) throw new Error( 'Invalid API response' );
        apiFormResponse.value = response.data;
        return apiFormResponse.value;
    };


    const deleteProfile = async ( id: string ) => {
        const response = await apiClient.delete( `/profiles/${id}` );
        return response?.data;
    };

    const fetchAccessList = async ( id: string ) => {
        const response = await apiClient.get( `/profiles/${id}/access` );
        if ( !response?.data ) throw new Error( 'Invalid API response' );
        return response.data;
    };

    return {
        apiViewResponse,
        apiFormResponse,
        setupApiClient,
        fetchAll: fetchProfiles,
        fetchAllUnsecured: fetchProfilesUnsecured,
        fetch: fetchProfile,
        save,
        delete: deleteProfile,
        getEntries,
        getPagination,
        getCurrent,
        updateCurrent,
        fetchAccessList
    };
} );