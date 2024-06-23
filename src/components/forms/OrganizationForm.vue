<template>
  <n-grid cols="1" x-gap="12" y-gap="12" class="project-details">
    <n-gi>
      <n-page-header subtitle="Organization" @back="goBack">
        <template #title>{{ store.getCurrent.identifier }}</template>
        <template #footer>
          Registered: {{ store.getCurrent.regDate }}, Last Modified: {{store.getCurrent.lastModifiedDate}}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2">
      <n-button-group>
<!--        <n-button type="default" @click="goBack" size="large">
          <n-icon>
            <ArrowBigLeft/>
          </n-icon>
          &nbsp;Back
        </n-button>-->
        <n-button type="primary" @click="handleSaveProject" size="large">Save</n-button>
      </n-button-group>
    </n-gi>
    <n-gi>
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Properties" mt="10">
          <div class="m-4">
            <n-form label-placement="left" label-width="auto">
              <n-grid col="1" x-gap="12" y-gap="12">
                <n-gi span="24">
                  <n-form-item label="Category">
                    <!--                    <n-input v-model:value="store.getCurrent.orgCategory?.identifier" style="width: 100%; max-width: 600px;"/>-->
                  </n-form-item>
                </n-gi>
                <n-gi span="24" v-for="(_, key) in store.getCurrent.localizedName" :key="key">
                  <n-form-item :label="`Name (${key})`">
                    <n-input v-model:value="store.getCurrent.localizedName[key]" class="w-80"/>
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item label="Identifier">
                    <n-input v-model:value="store.getCurrent.identifier" />
                  </n-form-item>
                </n-gi>
                <n-gi span="24">
                  <n-form-item label="Business ID">
                    <n-input v-model:value="store.getCurrent.bizID" class="w-11"/>
                  </n-form-item>
                </n-gi>
                <n-gi span="24">
                  <n-form-item label="Status">
                    <n-input v-model:value="store.getCurrent.status"/>
                  </n-form-item>
                </n-gi>
                <n-gi span="24">
                  <n-form-item label="Rank">
                    <n-input-number v-model:value="store.getCurrent.rank" class="w-20"/>
                  </n-form-item>
                </n-gi>
<!--                <n-gi span="24">
                  <n-form-item label="Registration Date">
                    <n-date-picker disabled v-model:formatted-value="store.getCurrent.regDate" class="w-40"/>
                  </n-form-item>
                </n-gi>
                <n-gi span="24">
                  <n-form-item label="Last Modified Date" class="short-field">
                    <n-date-picker disabled v-model:formatted-value="store.getCurrent.lastModifiedDate" class="w-40"/>
                  </n-form-item>
                </n-gi>-->
              </n-grid>
            </n-form>
          </div>
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
import {defineComponent, ref, onMounted, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import { NPageHeader, NButton, NButtonGroup, NForm, NFormItem, NInput, NInputNumber, NIcon, NTabs, NTabPane, NGrid,
  NGi, NH2, NDatePicker
} from 'naive-ui';
import {ArrowBigLeft} from '@vicons/tabler';
import {useOrganizationStore} from "../../stores/of/organizationStore";

export default defineComponent({
  name: 'OrganizationForm',
  components: { NPageHeader, NButtonGroup, NForm, NDatePicker, NFormItem, NInput, NInputNumber, NButton, NIcon,
    NTabs, NTabPane, NGrid, NGi, NH2, ArrowBigLeft,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useOrganizationStore();
    const activeTab = ref('properties');
    const localizedNames = computed(() => store.getCurrent.localizedName || {});

    const handleSaveProject = async () => {
      await store.save();
      router.push('/references/organizations');
    };

    const goBack = () => {
      router.push('/references/organizations');
    };

    onMounted(async () => {
      const id = route.params.id as string;
      await store.fetch(id);
    });

    return {
      store,
      localizedNames,
      handleSaveProject,
      activeTab,
      goBack,
    };
  },
});
</script>

<style scoped>
.project-details {
  padding: 20px;
}

.project-details h2 {
  margin-bottom: 20px;
}

.n-button {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.short-field .n-form-item-content {
  max-width: 300px;
  margin-right: 120px;
}

.number-field .n-form-item-content {
  max-width: 100px;
  margin-right: 120px;
}

.form-field {
  margin-bottom: 16px;
}
</style>
