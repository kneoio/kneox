import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../../api/apiClient';

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

  const fetchGenres = async () => {
    const response = await apiClient.get('/genres');
    if (!response?.data?.payload) throw new Error('Invalid API response');

    genreOptions.value = response.data.payload.viewData.entries
        .map((entry: any) => ({
            label: entry.identifier,
            value: entry.identifier
        }))
        .sort((a: {label: string}, b: {label: string}) =>
            a.label.localeCompare(b.label));
  };

  return {
    countryOptions,
    languageOptions,
    genreOptions,
    fetchGenres
  };
});
