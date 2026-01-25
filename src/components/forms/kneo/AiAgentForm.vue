<template>
  <n-grid cols="6" x-gap="12" y-gap="12" class="m-5">
    <n-gi span="6">
      <n-page-header :subtitle="formTitle" @back="goBack">
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
      <n-tabs v-model:value="activeTab">
        <n-tab-pane name="properties" tab="Main properties">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
              <n-gi>
                <n-form-item label="Name">
                  <n-input v-model:value="localFormData.name" style="width: 50%; max-width: 600px;" placeholder="" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Copilot">
                  <n-select v-model:value="localFormData.copilotId" :options="copilotOptions" filterable clearable
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Preferred Languages">
                  <n-dynamic-input v-model:value="localFormData.preferredLang" :on-create="createLangPrefItem"
                    style="width: 40%;">
                    <template #default=" { value } ">
                      <n-grid cols="2" x-gap="8">
                        <n-gi>
                          <n-select v-model:value="value.languageTag" :options="langOptions"
                            style="width: 100%; max-width: 300px;" />
                        </n-gi>
                        <n-gi>
                          <n-input-number v-model:value="value.weight" :min="0" :max="1" :step="0.05"
                            style="width: 100%; max-width: 100px;" />
                        </n-gi>
                      </n-grid>
                    </template>
                  </n-dynamic-input>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="LLM Type">
                  <n-select v-model:value="localFormData.llmType" :options="llmTypeOptions"
                    style="width: 25%; max-width: 300px;" />
                </n-form-item>
              </n-gi>

            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="tts" tab="TTS">
          <n-form label-placement="left" label-width="auto">
            <n-grid :cols="1" x-gap="12" y-gap="12" class="m-3">
                            <n-gi>
                <n-form-item label="DJ">
                  <n-space :size="8" vertical>
                    <n-select v-model:value="languageFilters.dj" :options="languageOptions" multiple clearable
                      placeholder="Filter lang" size="small" style="width: 200px; margin-left: auto;"
                      @update:value="fetchFilteredVoicesForTts( 'dj' )" />
                    <n-space :size="8">
                      <n-select :value="localFormData.ttsSetting?.dj?.engineType?.toString().toUpperCase() || null"
                        :options="ttsEngineTypeOptions" style="width: 150px;"
                        @update:value="setTtsEngineType( 'dj', $event as TTSEngineType | null )" />
                      <n-select :value="localFormData.ttsSetting?.dj?.id || null"
                        :options="filteredTtsVoiceOptions( 'dj' )" :render-label="renderVoiceLabel" filterable
                        style="width: 300px;" @update:value="setTtsVoice( 'dj', $event as string | null )" />
                    </n-space>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="News Reporter">
                  <n-space :size="8" vertical>
                    <n-select v-model:value="languageFilters.newsReporter" :options="languageOptions" multiple
                      clearable placeholder="Filter lang" size="small" style="width: 200px; margin-left: auto;"
                      @update:value="fetchFilteredVoicesForTts( 'newsReporter' )" />
                    <n-space :size="8">
                      <n-select :value="localFormData.ttsSetting?.newsReporter?.engineType?.toString().toUpperCase() || null"
                        :options="ttsEngineTypeOptions" style="width: 150px;"
                        @update:value="setTtsEngineType( 'newsReporter', $event as TTSEngineType | null )" />
                      <n-select :value="localFormData.ttsSetting?.newsReporter?.id || null"
                        :options="filteredTtsVoiceOptions( 'newsReporter' )" :render-label="renderVoiceLabel" filterable
                        style="width: 300px;" @update:value="setTtsVoice( 'newsReporter', $event as string | null )" />
                    </n-space>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="Weather Reporter">
                  <n-space :size="8" vertical>
                    <n-select v-model:value="languageFilters.weatherReporter" :options="languageOptions" multiple
                      clearable placeholder="Filter lang" size="small" style="width: 200px; margin-left: auto;"
                      @update:value="fetchFilteredVoicesForTts( 'weatherReporter' )" />
                    <n-space :size="8">
                      <n-select :value="localFormData.ttsSetting?.weatherReporter?.engineType?.toString().toUpperCase() || null"
                        :options="ttsEngineTypeOptions" style="width: 150px;"
                        @update:value="setTtsEngineType( 'weatherReporter', $event as TTSEngineType | null )" />
                      <n-select :value="localFormData.ttsSetting?.weatherReporter?.id || null"
                        :options="filteredTtsVoiceOptions( 'weatherReporter' )" :render-label="renderVoiceLabel"
                        filterable style="width: 300px;"
                        @update:value="setTtsVoice( 'weatherReporter', $event as string | null )" />
                    </n-space>
                  </n-space>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="acl" tab="ACL">
          <acl-table :acl-data="aclData" :loading="aclLoading" />
        </n-tab-pane>
      </n-tabs>
    </n-gi>
  </n-grid>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NButtonGroup,
  NDynamicInput,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSlider,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useLoadingBar,
  useMessage
} from 'naive-ui';
import { useAiAgentStore } from '../../../stores/kneo/aiAgentStore';
import { useReferencesStore } from '../../../stores/kneo/referencesStore';
import AclTable from '../../common/AclTable.vue';
import { AiAgentSave, AiAgentForm, TTSEngineType, TTSSettingDTO, VoiceDTO } from '../../../types/kneoBroadcasterTypes';
import { getErrorMessage, handleFormSaveError } from '../../../utils/errorHandling';

export default defineComponent( {
  name: "AiAgentForm",
  components: {
    NPageHeader,
    NButtonGroup,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NTabs,
    NTabPane,
    NGrid,
    NGi,
    NSelect,
    NSlider,
    NDynamicInput,
    NSpace,
    NInputNumber,
    NTag,
    AclTable
  },
  setup() {
    const loadingBar = useLoadingBar();
    const message = useMessage();
    const router = useRouter();
    const store = useAiAgentStore();
    const referencesStore = useReferencesStore();
    const route = useRoute();

    const activeTab = ref( "properties" );
    const aclData = ref( [] );
    const aclLoading = ref( false );
    const languageFilters = reactive<Record<string, string[]>>( {
      dj: [],
      newsReporter: [],
      weatherReporter: []
    } );

    const formTitle = computed( () => localFormData.id ? 'Edit AI Agent' : 'Create New AI Agent' );

    const filteredTtsVoiceOptions = ( key: keyof TTSSettingDTO ) => {
      const filters = languageFilters[key as string] || [];
      const options = ttsVoiceOptionsFor( key );
      if ( filters.length === 0 ) return options;
      return options.filter( ( v: any ) =>
        filters.some( lang => v.language?.startsWith( lang.split( '-' )[0] ) )
      );
    };

    const fetchFilteredVoicesForTts = async ( key: keyof TTSSettingDTO ) => {
      const engineType = ( localFormData.ttsSetting as any )?.[key]?.engineType as TTSEngineType | null | undefined;
      const engine = engineParamFor( engineType );
      if ( engine ) {
        const filters = languageFilters[key as string] || [];
        await referencesStore.fetchVoices( engine, 1, '', { languages: filters } );
      }
    };

    const renderVoiceLabel = ( option: any ) => {
      return h( 'span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        option.language ? h( NTag, { type: 'info', size: 'small' }, { default: () => option.language } ) : null,
        ...( option.labels || [] ).filter( ( label: string ) => label ).map( ( label: string ) =>
          h( NTag, { type: 'success', size: 'small' }, { default: () => label } )
        ),
        h( 'span', option.name )
      ].filter( Boolean ) );
    };

    const ttsEngineTypeOptions = [
      { label: 'elevenlabs', value: TTSEngineType.ELEVENLABS },
      { label: 'modelslab', value: TTSEngineType.MODELSLAB },
      { label: 'google', value: TTSEngineType.GOOGLE }
    ];

    const engineParamFor = ( engineType: TTSEngineType | null | undefined ) => {
      if ( !engineType ) return null;
      const upperType = engineType.toString().toUpperCase();
      if ( upperType === TTSEngineType.ELEVENLABS ) return 'elevenlabs';
      if ( upperType === TTSEngineType.MODELSLAB ) return 'modelslab';
      if ( upperType === TTSEngineType.GOOGLE ) return 'google';
      return null;
    };

    const ttsVoiceOptionsFor = ( key: keyof TTSSettingDTO ) => {
      const engineType = ( localFormData.ttsSetting as any )?.[key]?.engineType as TTSEngineType | null | undefined;
      const engine = engineParamFor( engineType );
      if ( !engine ) return [];
      const voices = ( referencesStore.voiceOptionsByEngine as any )?.[engine] || [];
      return voices.map( ( v: any ) => ( {
        id: v.id,
        name: v.name,
        language: v.language,
        labels: v.labels,
        label: v.name,
        value: v.id
      } ) );
    };

    const copilotOptions = computed( () => {
      const list = store.getEntries || [];
      return ( list as any[] ).map( ( a: any ) => ( {
        label: a?.name || a?.id || '',
        value: a?.id || ''
      } ) ).filter( opt => !!opt.value );
    } );

    const localFormData = reactive<AiAgentForm>( {
      id: "",
      author: "",
      regDate: "",
      lastModifier: "",
      lastModifiedDate: "",
      name: "",
      preferredLang: [],
      llmType: "",
      ttsSetting: {},
      copilotId: "",
      talkativity: 0,
      podcastMode: 0
    } );

    const createVoiceItem = () => ( {
      id: "",
      name: ""
    } );

    const createToolItem = () => ( {
      name: "",
      variableName: null,
      description: ""
    } );

    const createLangPrefItem = () => ( { languageTag: 'en-US', weight: 1 } );

    const setTtsVoice = ( key: keyof TTSSettingDTO, voiceId: string | null ) => {
      if ( !localFormData.ttsSetting ) {
        ( localFormData as any ).ttsSetting = {};
      }

      if ( !voiceId ) {
        delete ( localFormData.ttsSetting as any )[key];
        return;
      }

      const existing = ( localFormData.ttsSetting as any )[key] as VoiceDTO | undefined;
      const engineType = existing?.engineType ?? null;
      const engine = engineParamFor( engineType );
      const options = engine ? ( referencesStore.voiceOptionsByEngine as any )?.[engine] || [] : [];
      const opt = options.find( ( v: { label: string; value: string } ) => v.value === voiceId );
      ( localFormData.ttsSetting as any )[key] = {
        id: voiceId,
        name: opt?.label || '',
        engineType
      } as VoiceDTO;
    };

    const setTtsEngineType = async ( key: keyof TTSSettingDTO, engineType: TTSEngineType | null ) => {
      if ( !localFormData.ttsSetting ) {
        ( localFormData as any ).ttsSetting = {};
      }

      const existingForClear = ( localFormData.ttsSetting as any )[key] as VoiceDTO | undefined;
      if ( existingForClear ) {
        ( localFormData.ttsSetting as any )[key] = { ...existingForClear, id: '', name: '', engineType } as VoiceDTO;
      }

      const engine = engineParamFor( engineType );
      if ( engine ) {
        const filters = languageFilters[key as string] || [];
        await referencesStore.fetchVoices( engine, 1, '', { languages: filters } );
      }

      const existing = ( localFormData.ttsSetting as any )[key] as VoiceDTO | undefined;
      if ( !existing ) {
        ( localFormData.ttsSetting as any )[key] = {
          id: '',
          name: '',
          engineType
        } as VoiceDTO;
        return;
      }
      ( localFormData.ttsSetting as any )[key] = { ...existing, engineType } as VoiceDTO;
    };

    const loadFormData = async ( agentData: AiAgentForm ) => {
      // First assign the data to localFormData
      if ( agentData.copilot ) {
        agentData.copilotId = agentData.copilot;
      }
      Object.assign( localFormData, agentData );
      
      // Set initial language filter for DJ based on preferredLang
      if ( localFormData.preferredLang && localFormData.preferredLang.length > 0 ) {
        languageFilters.dj = localFormData.preferredLang.map( ( lang: any ) => lang.languageTag );
      }

      // Then fetch voices for each engine type
      const entries = Object.entries( ( localFormData.ttsSetting || {} ) as any );
      const voiceFetchPromises = [];

      for ( const [, entry] of entries ) {
        const engine = engineParamFor( ( entry as any )?.engineType as TTSEngineType | null | undefined );
        if ( engine ) {
          const key = entry as keyof TTSSettingDTO;
          const filters = key === 'dj' ? languageFilters.dj || [] : [];
          voiceFetchPromises.push( referencesStore.fetchVoices( engine, 1, '', { languages: filters } ) );
        }
      }

      await Promise.all( voiceFetchPromises );
      
      // After initial fetch, refresh DJ voices with the language filter
      if ( localFormData.ttsSetting?.dj?.engineType ) {
        await fetchFilteredVoicesForTts( 'dj' );
      }
    };

    const handleSave = async () => {
      try {
        loadingBar.start();

        const saveData: AiAgentSave = {
          name: localFormData.name || '',
          preferredLang: localFormData.preferredLang || [],
          llmType: localFormData.llmType || '',
          searchEngineType: ( localFormData as any ).searchEngineType || undefined,
          ttsSetting: localFormData.ttsSetting,
          talkativity: ( localFormData as any ).talkativity || 0,
          podcastMode: ( localFormData as any ).podcastMode || 0
        };

        if ( localFormData.copilotId ) {
          saveData.copilot = localFormData.copilotId;
        }

        const id = localFormData.id ? localFormData.id : null;
        const response = await store.save( saveData, id );
        message.success( "AI Agent saved successfully" );

        if ( !id && response?.id ) {
          await router.push( `/outline/ai_agents/${response.id}` );
        } else {
          await store.fetch( localFormData.id );
          const agentData = { ...store.getCurrent } as AiAgentForm;
          await loadFormData( agentData );
        }
      } catch ( error: any ) {
        console.error( 'Failed to save AI Agent:', error );
        handleFormSaveError( error, message );
      } finally {
        loadingBar.finish();
      }
    };

    const goBack = () => {
      router.push( "/outline/ai_agents" );
    };

    const fetchAclData = async () => {
      const id = route.params.id as string;
      if ( !id || id === 'new' ) {
        aclData.value = [];
        return;
      }
      try {
        aclLoading.value = true;
        const response = await store.fetchAccessList( id );
        aclData.value = response.accessList || [];
      } catch ( error ) {
        console.error( 'Failed to fetch ACL data:', error );
        message.error( 'Failed to fetch access control list' );
        aclData.value = [];
      } finally {
        aclLoading.value = false;
      }
    };

    watch( activeTab, ( newTab ) => {
      if ( newTab === 'acl' && localFormData.id ) {
        fetchAclData();
      }
    } );

    onMounted( async () => {
      try {
        loadingBar.start();
        await referencesStore.fetchVoices( 'elevenlabs', 1, '', {} );
        await referencesStore.fetchVoices( 'google', 1, '', {} );
        await referencesStore.fetchVoices( 'modelslab', 1, '', {} );
        try { await store.fetchAllUnsecured( 1, 1000 ); } catch { }
        const id = route.params.id as string;
        if ( id ) {
          await store.fetch( id );
          const agentData = { ...store.getCurrent } as AiAgentForm;
          await loadFormData( agentData );
        }
      } catch ( error: any ) {
        console.error( "Failed to fetch data:", error );
        const data = error?.response?.data;
        if ( data?.message ) {
          message.error( String( data.message ) );
        } else {
          message.error( getErrorMessage( error ) );
        }
        if ( route.params.id ) {
          router.push( "/outline/ai_agents" );
        }
      } finally {
        loadingBar.finish();
      }
    } );

    return {
      localFormData,
      langOptions: referencesStore.languageOptions,
      languageOptions: referencesStore.languageOptions,
      llmTypeOptions: referencesStore.llmTypeOptions,
      filteredTtsVoiceOptions,
      fetchFilteredVoicesForTts,
      renderVoiceLabel,
      ttsEngineTypeOptions,
      ttsVoiceOptionsFor,
      setTtsVoice,
      setTtsEngineType,
      copilotOptions,
      referencesStore,
      formTitle,
      createVoiceItem,
      createToolItem,
      createLangPrefItem,
      handleSave,
      goBack,
      activeTab,
      aclData,
      aclLoading,
      languageFilters
    };

  }
} );
</script>