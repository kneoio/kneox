<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header subtitle="AI Agent" @back="goBack">
        <template #title>{{ localFormData.name || 'New AI Agent' }}</template>
        <template #footer>
          Registered: {{ localFormData.regDate }}, Last Modified: {{ localFormData.lastModifiedDate }}
          <br>
          Author: {{ localFormData.author }}, Last Modifier: {{ localFormData.lastModifier }}
        </template>
      </n-page-header>
    </n-gi>
    <n-gi class="mt-2" span="6">
      <n-button-group>
        <n-button type="primary" @click="handleSave" size="large">Save</n-button>
        <n-button type="default" disabled size="large">Archive</n-button>
      </n-button-group>
    </n-gi>
    <n-gi span="6">
      <n-form label-placement="left" label-width="auto">
        <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
          <n-gi>
            <n-form-item label="Name">
              <n-input v-model:value="localFormData.name" style="width: 50%; max-width: 600px;"/>
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="Main Prompt">
              <CodeMirror
                      v-model="localFormData.mainPrompt"
                      basic
                      :lang="lang"
                      :style="{
                        width: '60%',
                        height: '200px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '3px',
                        backgroundColor: '#f5f5f5',
                        opacity: '0.6',
                        cursor: 'not-allowed'
                      }"
                      :extensions="editorExtensions"
                      :editable="false"
                  />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-form>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, reactive, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {
  NButton,
  NButtonGroup,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPageHeader,
  useLoadingBar,
  useMessage
} from "naive-ui";
import {html} from '@codemirror/lang-html';
import {EditorView} from '@codemirror/view';
import CodeMirror from 'vue-codemirror6';
import {
  AiAgent, AiAgentSave
} from "../../../types/kneoBroadcasterTypes";
import {useAiAgentStore} from "../../../stores/kneo/aiAgentStore";

export default defineComponent({
  name: "AiAgentForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NGrid,
    NGi,
    CodeMirror
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useAiAgentStore();
    const route = useRoute();
    const lang = ref(html());
    const editorExtensions = computed(() => [
      EditorView.lineWrapping
    ]);
    const localFormData = reactive<Partial<AiAgent>>({
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      mainPrompt: "",
      preferredLang: "en", // Default value
      preferredVoice: [],
      enabledTools: []
    });

    const handleSave = async () => {
      try {
        loadingBar.start();
        const payload: AiAgentSave = {
          name: localFormData.name || '',
          mainPrompt: localFormData.mainPrompt || '',
          preferredLang: localFormData.preferredLang || 'en',
          preferredVoice: localFormData.preferredVoice || [],
          enabledTools: localFormData.enabledTools || []
        };
        
        const id = localFormData.id ? localFormData.id : undefined;
        await store.save(payload, id);
        
        message.success("AI Agent saved successfully");
        await router.push("/outline/ai_agents");
      } catch (error) {
        console.error("Failed to save AI Agent:", error);
        message.error("Failed to save AI Agent");
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push("/outline/ai_agents");
    };

    onMounted(async () => {
      const id = route.params.id as string;
      if (id && id !== 'new') {
        try {
          loadingBar.start();
          await store.fetch(id);
          Object.assign(localFormData, store.getCurrent);
        } catch (error) {
          console.error("Failed to fetch AI Agent:", error);
          message.error('Failed to fetch AI Agent');
        } finally {
          loadingBar.finish();
        }
      }
    });

    return {
      localFormData,
      handleSave,
      goBack,
      editorExtensions,
      lang
    };
  }
});
</script>