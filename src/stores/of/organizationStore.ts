import {defineStore} from 'pinia';
import {ref} from 'vue';
import {setupApiClient} from '../../apiClient';
import {fetchOrgs} from "../../api/of/organizationApiClient";
import {ViewPage} from "../../types/ofTypes";
import {useLoadingBar, useMessage} from "naive-ui";

export const useOrganizationStore = defineStore('organizationStore', () => {
    const organizationPage = ref<ViewPage | null>(null);
    const msgPopup = useMessage();
    const loadingBar = useLoadingBar();


    const fetchOrganizations = async (page = 1, pageSize = 10) => {
        try {
            loadingBar.start();
            const response = await fetchOrgs(page, pageSize);
            if (response && response.payload) {
                console.log(response.payload);
                organizationPage.value = response.payload;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error: any) {
            loadingBar.error();
            msgPopup.error('Failed to fetch employers: ' + (error.message || 'Unknown error'));
            throw error;
        } finally {
            loadingBar.finish();
        }
    };

    return {
        organizationPage,
        setupApiClient,
        fetchOrganizations
    };
});
