import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../../api/apiClient';

export const useReferencesStore = defineStore('references', () => {
  const countryOptions = [
    { label: "United States", value: "US" },
    { label: "United Kingdom", value: "GB" },
    { label: "Germany", value: "DE" },
    { label: "France", value: "FR" },
    { label: "Latvia", value: "LV" },
    { label: "Spain", value: "ES" },
    { label: "Portugal", value: "PT" },
    { label: "Kazakhstan", value: "KZ" }
  ];

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "Portuguese", value: "pt" },
    { label: "Kazakh", value: "kk" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Russian", value: "ru" },
    { label: "Latvian", value: "lv" }
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
