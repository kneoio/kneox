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
                  <n-input v-model:value="localData.orgCategory.localizedName"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi v-for="(_, key) in localData.localizedName" :key="key">
                <n-form-item :label="`Name (${key})`">
                  <n-input v-model:value="localData.localizedName[key]"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Business ID">
                  <n-input v-model:value="localData.bizID"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Identifier">
                  <n-input v-model:value="localData.identifier"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Rank">
                  <n-input-number v-model:value="localData.rank"
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
import {defineComponent, ref, onMounted, computed, reactive} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  NPageHeader, NButton, NButtonGroup, NForm, NFormItem, NInput, NInputNumber, NIcon, NTabs, NTabPane, NGrid,
  NGi, NH2, NDatePicker, NSpace
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {useOrganizationStore} from "../../stores/of/organizationStore";
import {Organization} from "../../types/officeFrameTypes";

export default defineComponent({
  name: 'OrganizationForm',
  components: {
    NPageHeader, NButtonGroup, NForm, NDatePicker, NFormItem, NInput, NInputNumber, NButton, NIcon,
    NTabs, NTabPane, NGrid, NGi, NH2, NSpace, ArrowBigLeft,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useOrganizationStore();
    const activeTab = ref('properties');
    const localizedNames = computed(() => store.getCurrent.localizedName || {});
    const localData = reactive<Organization>({
      id: '',
      identifier: '',
      bizID: '',
      localizedName: {},
      orgCategory: {
        localizedName: ''
      },
      status: '',
      rank: 0,
    });

    const handleSaveProject = async () => {
      await store.save(localData);
      router.push('/references/organizations');
    };

    const handleArchive = async () => {

    }

    const goBack = () => {
      router.push('/references/organizations');
    };

    onMounted(async () => {
      const id = route.params.id as string;
      await store.fetch(id);
      Object.assign(localData, store.getCurrent);
    });

    return {
      store,
      localData,
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
