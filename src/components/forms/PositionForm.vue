<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="m-5">
    <n-gi>
      <n-page-header subtitle="Position" @back="goBack">
        <template #title>{{ store.getCurrent.identifier }}</template>
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
                <n-form-item label="Identifier">

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
import {Position, PositionSave} from "../../types/officeFrameTypes";
import {usePositionStore} from "../../stores/of/positionStore";

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
    const store = usePositionStore();
    const activeTab = ref('properties');
    const departmentOptions = ref([]);
    const localFormData = reactive<Position>({
      id: '',
      author: '',
      regDate: '',
      lastModifier: '',
      lastModifiedDate: '',
      identifier: '',
      localizedName: {},
    });

    const handleSave = async () => {
      loadingBar.start();
      try {
        const saveDTO: PositionSave = {
          identifier: localFormData.identifier,
          localizedName: localFormData.localizedName,
        };
        await store.save(saveDTO, localFormData.id);
        message.success('Saved successfully');
        router.push('/references/lookups/positions');
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



    onMounted(async () => {
      const id = route.params.id as string;
      if (id) {
        loadingBar.start();
        try {
          await Promise.all([
            store.fetch(id),
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
      localFormData,
      handleSave,
      handleArchive,
      activeTab,
      goBack,
      departmentOptions,
    };
  },
});
</script>

<style scoped>
</style>
