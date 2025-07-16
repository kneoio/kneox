import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../../api/apiClient';
import { unsecuredClient } from '../../api/apiClient';

export const useReferencesStore = defineStore('references', () => {
  const countryOptions = [
    { label: "United States", value: "US" },
    { label: "United Kingdom", value: "GB" },
    { label: "Deutschland", value: "DE" },
    { label: "France", value: "FR" },
    { label: "Latvija", value: "LV" },
    { label: "España", value: "ES" },
    { label: "Portugal", value: "PT" },
    { label: "Қазақстан", value: "KZ" },
    { label: "日本", value: "JP" },
    { label: "中国", value: "CN" },
    { label: "한국", value: "KR" },
    { label: "भारत", value: "IN" },
    { label: "Україна", value: "UA" },
    { label: "Suomi", value: "FI" },
    { label: "Norge", value: "NO" },
    { label: "Sverige", value: "SE" },
    { label: "Polska", value: "PL" },
    { label: "Italia", value: "IT" },
    { label: "Türkiye", value: "TR" }
 ];
 
 const languageOptions = [
    { label: "English", value: "en" },
    { label: "Português", value: "pt" },
    { label: "Қазақша", value: "kk" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
    { label: "Русский", value: "ru" },
    { label: "Latviešu", value: "lv" },
    { label: "日本語", value: "ja" },
    { label: "中文", value: "zh" },
    { label: "한국어", value: "ko" },
    { label: "हिंदी", value: "hi" },
    { label: "Українська", value: "uk" },
    { label: "Suomi", value: "fi" },
    { label: "Norsk", value: "no" },
    { label: "Svenska", value: "sv" },
    { label: "Polski", value: "pl" },
    { label: "Italiano", value: "it" },
    { label: "Türkçe", value: "tr" }
 ];

  const genreOptions = ref<Array<{label: string, value: string}>>([]);

  const audioAcceptTypes = [
    '.mp3',
    '.wav',
    '.ogg',
    '.flac',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/flac',
    'audio/x-wav',
    'audio/mp4',
  ].join(',');

  const fetchGenres = async () => {
    const response = await apiClient.get('/dictionary/genres?page=1&size=100');
    if (!response?.data?.payload) throw new Error('Invalid API response');

    genreOptions.value = response.data.payload.viewData.entries
        .map((entry: any) => ({
            label: entry.identifier,
            value: entry.identifier
        }))
        .sort((a: {label: string}, b: {label: string}) =>
            a.label.localeCompare(b.label));
  };

  const fetchDictionary = async (type: 'agents' | 'profiles', page = 1, pageSize = 100) => {
    const response = await unsecuredClient.get(`/api/dictionary/${type}?page=${page}&size=${pageSize}`);
    if (response?.data?.payload) {
      return response.data.payload;
    } else {
      throw new Error('Invalid API response structure');
    }
  };

  const fetchRadioStations = async () => {
    try {
      const response = await unsecuredClient.get('/radio/all-stations');
      return response.data;
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      throw error;
    }
  };

  const voiceOptions = [
    { label: 'Alloy (English)', value: 'alloy' },
    { label: 'Echo (English)', value: 'echo' },
    { label: 'Fable (English)', value: 'fable' },
    { label: 'Onyx (English)', value: 'onyx' },
    { label: 'Nova (English)', value: 'nova' },
    { label: 'Shimmer (English)', value: 'shimmer' },
    { label: 'Aria (English)', value: 'aria' },
    { label: 'Drew (English)', value: 'drew' },
    { label: 'Bella (English)', value: 'bella' },
    { label: 'Andy (English)', value: 'andy' },
    { label: 'Rachel (English)', value: 'rachel' },
    { label: 'Domi (English)', value: 'domi' },
    { label: 'Thomas (English)', value: 'thomas' },
    { label: 'Charlotte (English)', value: 'charlotte' },
    { label: 'Callum (English)', value: 'callum' },
    { label: 'Liam (English)', value: 'liam' },
    { label: 'Ruth (English)', value: 'ruth' },
    { label: 'Daisy (English)', value: 'daisy' },
    { label: 'Alain (French)', value: 'alain' },
    { label: 'Brigitte (French)', value: 'brigitte' },
    { label: 'Claude (French)', value: 'claude' },
    { label: 'Jacqueline (French)', value: 'jacqueline' },
    { label: 'Hans (German)', value: 'hans' },
    { label: 'Bettina (German)', value: 'bettina' },
    { label: 'Stefan (German)', value: 'stefan' },
    { label: 'Hiroshi (Japanese)', value: 'hiroshi' },
    { label: 'Hikari (Japanese)', value: 'hikari' },
    { label: 'Takeru (Japanese)', value: 'takeru' },
    { label: 'Zhiyu (Chinese)', value: 'zhiyu' },
    { label: 'Nari (Korean)', value: 'nari' },
  ];

  return {
    countryOptions,
    languageOptions,
    voiceOptions,
    genreOptions,
    audioAcceptTypes,
    fetchGenres,
    fetchDictionary,
    fetchRadioStations
  };
});
