import {defineStore} from 'pinia';
import {ref, computed} from 'vue';
import apiClient, {setupApiClient} from '../../api/apiClient';
import {ApiFormResponse, ApiViewPageResponse} from "../../types";
import {Organization, OrganizationSave} from "../../types/officeFrameTypes";
import {PaginationInfo} from "naive-ui";

export const useOrganizationStore = defineStore('organizationStore', () => {
    const apiViewResponse = ref<ApiViewPageResponse<Organization> | null>(null);
    const apiViewResponsePrimary = ref<ApiViewPageResponse<Organization> | null>(null);
    const apiFormResponse = ref<ApiFormResponse | null>(null);

    const getEntries = computed(() => {
        return apiViewResponse.value?.viewData.entries || [];
    });

    const getCurrent = computed(() => {
        const defaultData = {
            regDate: '',
            lastModifiedDate: '',
            identifier: '',
            bizID: '',
            localizedName: {},
            orgCategory: {
                localizedName: ''
            },
            status: '',
            rank: 0
        };
        return apiFormResponse.value?.docData || defaultData;
    });

    const getPagination = computed<PaginationInfo>(() => {
        const page = apiViewResponse.value?.viewData.pageNum ?? 1;
        const pageSize = apiViewResponse.value?.viewData.pageSize ?? 10;
        const itemCount = apiViewResponse.value?.viewData.count;
        const pageCount = apiViewResponse.value?.viewData.maxPage ?? 1;

        return {
            startIndex: 0,
            endIndex: 0,
            page,
            pageSize,
            pageCount,
            itemCount,
        };
    });

    const getOptions = computed(() => {
        return getEntries.value.map(doc => ({
            label: doc.localizedName.ENG,
            value: doc.id
        }));
    });

    const getOptionsOfPrimaries = computed(() => {
        // Accessing `viewData` to get `entries`
        const entries = apiViewResponsePrimary.value?.viewData.entries || [];
        console.log('Entries from apiViewResponsePrimary:', entries); // Check the actual entries
        return Array.isArray(entries) ? entries.map(doc => ({
            label: doc.localizedName.ENG,
            value: doc.id
        })) : [];
    });


    const fetchOrgs = async (page = 1, pageSize = 10) => {
        const response = await apiClient.get(`/orgs?page=${page}&size=${pageSize}`);
        if (response && response.data && response.data.payload) {
            apiViewResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const fetchPrimaryOrgs = async () => {
        try {
            const response = await apiClient.get('/orgs/only/primary');
            if (response && response.data && response.data.payload) {
                apiViewResponsePrimary.value = response.data.payload as ApiViewPageResponse<Organization>;
                console.log('Fetched Primary Organizations:', apiViewResponsePrimary.value); // Log updated structure
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            console.error('Fetch Primary Orgs Error:', error);
        }
    };


    const fetchOrg = async (id: string) => {
        const response = await apiClient.get(`/orgs/${id}`);
        if (response && response.data && response.data.payload) {
            apiFormResponse.value = response.data.payload;
        } else {
            throw new Error('Invalid API response structure');
        }
    };

    const updateCurrent = (data: Organization, actions: any = {}) => {
        apiFormResponse.value = {
            docData: data,
            actions: actions
        };
    };

    const save = async (data: OrganizationSave, id?: string) => {
        const response = await apiClient.post(`/orgs/${id}`, data);
        if (response && response.data) {
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
        fetchAll: fetchOrgs,
        fetch: fetchOrg,
        fetchPrimaryOrganizations: fetchPrimaryOrgs,
        getOptions,
        getOptionsOfPrimaries,
        save,
        getEntries,
        getPagination,
        getCurrent
    };
});