<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Language" @back="goBack">
        <template #title>{{ store.getCurrent.code }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{ store.getCurrent.lastModifiedDate }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" disabled @click="handleArchive" size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi v-for="(_, key) in localFormData.localizedName" :key="key">
                <n-form-item :label="`Name (${key})`">
                  <n-input v-model:value="localFormData.localizedName[key]"
                           style="width: 50%; max-width: 600px;"/>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Code">
                  <n-select
                      v-model:value="localFormData.code"
                      :options="store.getOptions"
                      style="width: 10%; max-width: 600px;"
                      @update:value="handleOrganizationChange"
                  />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="Rank">
                  <n-input-number v-model:value="localFormData.position"
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
import {defineComponent, onMounted, reactive, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  NButton,
  NButtonGroup,
  NDatePicker,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NH2,
  NIcon,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {Language, LanguageSave} from "../../types/officeFrameTypes";
import {usePositionStore} from "../../stores/of/positionStore";
import {useOrganizationStore} from "../../stores/of/organizationStore";
import {useDepartmentStore} from "../../stores/of/departmentStore";
import {useLanguageStore} from "../../stores/of/languageStore";

export default defineComponent({
  name: 'LanguageForm',
  components: {
    NPageHeader, NButtonGroup, NForm, NDatePicker, NFormItem, NInput, NInputNumber, NButton, NIcon,
    NTabs, NTabPane, NGrid, NGi, NH2, NSpace, ArrowBigLeft, NSelect
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const route = useRoute();
    const router = useRouter();
    const store = useLanguageStore();
    const organizationStore = useOrganizationStore();
    const departmentStore = useDepartmentStore();
    const positionStore = usePositionStore();
    const activeTab = ref('properties');
    const departmentOptions = ref([]);
    const localFormData = reactive<Language>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      localizedName: {},
      code: '',
      position: 0,
    });

    const handleSave = async () => {
      loadingBar.start();
      try {
        const saveDTO: LanguageSave = {
          code: localFormData.code,
          localizedName: localFormData.localizedName,
        };
        await store.save(saveDTO, localFormData.id);
        message.success('Organization saved successfully');
        router.push('/references/employees');
      } catch (error) {
        console.error('Failed to save: ', error);
        message.error('Failed to save');
        loadingBar.error();
      } finally {
        loadingBar.finish();
      }
    };

    const handleArchive = async () => {
      message.info('Archive functionality not implemented yet');
    }

    const goBack = () => {
      router.push('/references/lookups/languages');
    };

    const handleOrganizationChange = async (organizationId: string) => {
      try {
        await departmentStore.fetchDepartmentsOf(organizationId);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        message.error('Failed to fetch departments');
      }
    };

    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await Promise.all([
            store.fetch(id),
            organizationStore.fetchPrimaryOrganizations(),
            positionStore.fetchAll()
          ]);
          Object.assign(localFormData, store.getCurrent);
          loadingBar.finish();
        } catch (error) {
          console.error('Failed to fetch employee:', error);
          message.error('Failed to fetch');
          loadingBar.error();
        }
      }
    });

    return {
      store,
      positionStore,
      organizationStore,
      departmentStore,
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      handleOrganizationChange,
      departmentOptions,
    };
  },
});
</script>

<style scoped>
</style>
