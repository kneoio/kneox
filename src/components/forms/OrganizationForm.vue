<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Organization" @back="goBack">
        <template #title>{{ store.getCurrent.identifier }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2">
      <n-space>
        <n-button type="primary" @click="handleSaveProject" size="large">Save</n-button>
        <n-button type="default"  disabled @click="handleArchive" size="large">Archive</n-button>
      </n-space>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Category">
                  <n-input v-model:value="localFormData.orgCategory.localizedName"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi v-for="(_, key) in localFormData.localizedName" :key="key">
                <n-form-item :label="`Name (${key})`">
                  <n-input v-model:value="localFormData.localizedName[key]"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Business ID">
                  <n-input v-model:value="localFormData.bizID"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Identifier">
                  <n-input v-model:value="localFormData.identifier"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Rank">
                  <n-input-number v-model:value="localFormData.rank"
                                  style="width: 10%"/>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="rls" tab="RLS" class="p-4">
        </n-tab-pane>
        <n-tab-pane name="additional" tab="Additional" class="p-4">
          <n-form label-placement="left" label-width="auto">
            <n-grid x-gap="12" y-gap="12">
              <!-- Additional form items can go here -->
            </n-grid>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NPageHeader, NButton, NButtonGroup, NForm, NFormItem, NInput, NInputNumber, NIcon, NTabs, NTabPane, NGrid,
  NGi, NH2, NDatePicker, NSpace, useLoadingBar, useMessage
} from 'naive-ui';
import { ArrowBigLeft } from '@vicons/tabler';
import { useOrganizationStore } from "../../stores/of/organizationStore";
import {Organization, OrganizationSave} from "../../types/officeFrameTypes";

export default defineComponent({
  name: 'OrganizationForm',
  components: {
    NPageHeader, NButtonGroup, NForm, NDatePicker, NFormItem, NInput, NInputNumber, NButton, NIcon,
    NTabs, NTabPane, NGrid, NGi, NH2, NSpace, ArrowBigLeft,
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
    const store = useOrganizationStore();
    const activeTab = ref('properties');
    const localizedNames = computed(() => store.getCurrent.localizedName || {});
    const localFormData = reactive<Organization>({
      id: '',
      identifier: '',
      bizID: '',
      localizedName: {},
      orgCategory: {
        id: '',
        identifier: '',
        localizedName: ''
      },
      status: '',
      rank: 0,
    });

    const handleSaveProject = async () => {
      loadingBar.start();
      try {
        const saveDTO: OrganizationSave = {
          identifier: localFormData.identifier,
          bizID: localFormData.bizID,
          localizedName: localFormData.localizedName,
          orgCategory: {
            id: localFormData.orgCategory.id
          },
          rank: localFormData.rank
        };
        await store.save(saveDTO, localFormData.id);
        message.success('Organization saved successfully');
        router.push('/references/organizations');
      } catch (error) {
        console.error('Failed to save organization:', error);
        message.error('Failed to save organization');
        loadingBar.error();
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = async () => {
      message.info('Archive functionality not implemented yet');
    }

    const goBack = () => {
      router.push('/references/organizations');
    };

    onMounted(async () => {
      const id = route.params.id as string;
      loadingBar.start();
      try {
        await store.fetch(id);
        Object.assign(localFormData, store.getCurrent);
        loadingBar.finish();
      } catch (error) {
        console.error('Failed to fetch organization:', error);
        message.error('Failed to fetch organization details');
        loadingBar.error();
      }
    });

    return {
      store,
      localFormData,
      localizedNames,
      handleSaveProject,
      handleArchive,
      activeTab,
      goBack,
    };
  },
});
</script>

<style scoped>

</style>
