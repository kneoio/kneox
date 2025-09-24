import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../../api/apiClient';
import { unsecuredClient, apiServer } from '../../api/apiClient';

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
    { label: "Türkiye", value: "TR" },
    { label: "საქართველო", value: "GE" }
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
    { label: "Türkçe", value: "tr" },
    { label: "ქართული", value: "ka" }
  ];

  const genreOptions = ref<Array<{label: string, value: string}>>([]);
  const voiceOptions = ref<Array<{label: string, value: string}>>([]);

  const musicUploadAgreement = ref<{ title: string; clause: string; version: string }>({
    title: 'Music Upload Agreement',
    version: '1.0',
    clause:
      'By uploading music to this service, you confirm that:\n\n' +
      '- **Ownership or License**: You own the copyright to this music OR have proper licensing/permission to distribute it.\n' +
      '- **Free to Use**: The music is either your original work, public domain, or licensed under terms that permit sharing on this platform.\n' +
      '- **No Infringement**: Your upload does not violate any third-party copyrights, trademarks, or other intellectual property rights.\n' +
      '- **Legal Responsibility**: You accept full legal responsibility for any copyright claims or disputes arising from your upload.\n' +
      '- **Removal Rights**: We reserve the right to remove any content that violates copyright or receives valid takedown requests.\n' +
      '- **Content Standards**: The music does not contain content that promotes violence, war, hate speech, discrimination, or offensive religious content.\n' +
      '- **Content Guidelines**: The content complies with general broadcasting standards and applicable content regulations.\n' +
      '- **Indemnification**: You agree to defend and hold harmless the service from any legal claims related to your uploaded content.\n\n'
  });

  const messagePostingAgreement = ref<{ title: string; clause: string; version: string }>({
    title: 'Message Posting Agreement',
    version: '1.0',
    clause:
      'By posting a message to this service, you agree that:\n\n' +
      '- **Appropriate Content**: Your message does not contain violence, racism, hate speech, discrimination, or harassment of any kind.\n' +
      '- **Respectful Communication**: You will communicate respectfully and avoid offensive, threatening, or abusive language.\n' +
      '- **No Harmful Content**: Your message does not promote illegal activities, self-harm, or dangerous behavior.\n' +
      '- **Personal Responsibility**: You are fully responsible for the content of your message and its consequences.\n' +
      '- **Moderation Rights**: We reserve the right to review, edit, or remove messages that violate these guidelines.\n' +
      '- **Broadcasting Standards**: Your content complies with general broadcasting standards and community guidelines.\n' +
      '- **Legal Compliance**: Your message does not violate any applicable laws or regulations.\n' +
      '- **Consequences**: Violation of these terms may result in message removal and potential restrictions on future submissions.\n\n'
  });

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
            value: entry.id
        }))
        .sort((a: {label: string}, b: {label: string}) =>
            a.label.localeCompare(b.label));
  };

  const fetchVoices = async () => {
    const response = await unsecuredClient.get('/dictionary/voices?page=1&size=100');
    if (!response?.data?.payload) throw new Error('Invalid API response');

    voiceOptions.value = response.data.payload.viewData.entries
        .map((entry: any) => ({
            label: entry.name,
            value: entry.id
        }))
        .sort((a: {label: string}, b: {label: string}) =>
            a.label.localeCompare(b.label));
  };

  const fetchDictionary = async (type: 'agents' | 'profiles' | 'voices', page = 1, pageSize = 100) => {
    const response = await unsecuredClient.get(`/dictionary/${type}?page=${page}&size=${pageSize}`);
    if (response?.data?.payload) {
      return response.data.payload;
    } else {
      throw new Error('Invalid API response structure');
    }
  };

  const fetchRadioStations = async () => {
    try {
      // Build absolute URL without trailing /api to avoid /api prefix for this endpoint
      const baseWithoutApi = apiServer.replace(/\/api\/?$/, '');
      const response = await unsecuredClient.get(`${baseWithoutApi}/radio/all-stations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      throw error;
    }
  };

  const eventTypeOptions = [
    { label: 'Advertisement', value: 'AD' },
    { label: 'Weather', value: 'WEATHER' },
    { label: 'Remainder', value: 'REMAINDER' }
  ];

  const timezones = [
    { label: 'UTC (+0)', value: 'UTC' },
    { label: 'Europe/London (+0/+1)', value: 'Europe/London' },
    { label: 'Europe/Riga (+2/+3)', value: 'Europe/Riga' },
    { label: 'Europe/Paris (+1/+2)', value: 'Europe/Paris' },
    { label: 'Europe/Lisbon (+0/+1)', value: 'Europe/Lisbon' },
    { label: 'Europe/Berlin (+1/+2)', value: 'Europe/Berlin' },
    { label: 'Europe/Rome (+1/+2)', value: 'Europe/Rome' },
    { label: 'Europe/Madrid (+1/+2)', value: 'Europe/Madrid' },
    { label: 'Europe/Kiev (+2/+3)', value: 'Europe/Kiev' },
    { label: 'Europe/Helsinki (+2/+3)', value: 'Europe/Helsinki' },
    { label: 'Europe/Oslo (+1/+2)', value: 'Europe/Oslo' },
    { label: 'Europe/Stockholm (+1/+2)', value: 'Europe/Stockholm' },
    { label: 'Europe/Warsaw (+1/+2)', value: 'Europe/Warsaw' },
    { label: 'Europe/Istanbul (+3)', value: 'Europe/Istanbul' },
    { label: 'Asia/Tbilisi (+4)', value: 'Asia/Tbilisi' },
    { label: 'Asia/Almaty (+6)', value: 'Asia/Almaty' },
    { label: 'Asia/Astana (+6)', value: 'Asia/Astana' },
    { label: 'Asia/Tashkent (+5)', value: 'Asia/Tashkent' },
    { label: 'America/New York (-5/-4)', value: 'America/New_York' },
    { label: 'America/Los Angeles (-8/-7)', value: 'America/Los_Angeles' },
    { label: 'America/Sao Paulo (-3)', value: 'America/Sao_Paulo' },
    { label: 'America/Argentina/Buenos Aires (-3)', value: 'America/Argentina/Buenos_Aires' },
    { label: 'America/Bogota (-5)', value: 'America/Bogota' },
    { label: 'America/Lima (-5)', value: 'America/Lima' },
    { label: 'America/Santiago (-4/-3)', value: 'America/Santiago' },
    { label: 'America/Caracas (-4)', value: 'America/Caracas' },
    { label: 'America/La Paz (-4)', value: 'America/La_Paz' },
    { label: 'America/Asuncion (-4/-3)', value: 'America/Asuncion' },
    { label: 'America/Montevideo (-3)', value: 'America/Montevideo' },
    { label: 'America/Guyana (-4)', value: 'America/Guyana' },
    { label: 'Asia/Tokyo (+9)', value: 'Asia/Tokyo' },
    { label: 'Asia/Shanghai (+8)', value: 'Asia/Shanghai' },
    { label: 'Asia/Seoul (+9)', value: 'Asia/Seoul' },
    { label: 'Asia/Kolkata (+5:30)', value: 'Asia/Kolkata' },
    { label: 'Asia/Dubai (+4)', value: 'Asia/Dubai' },
    { label: 'Africa/Cairo (+2)', value: 'Africa/Cairo' },
    { label: 'Africa/Lagos (+1)', value: 'Africa/Lagos' },
    { label: 'Africa/Johannesburg (+2)', value: 'Africa/Johannesburg' },
    { label: 'Africa/Nairobi (+3)', value: 'Africa/Nairobi' },
    { label: 'Africa/Casablanca (+1)', value: 'Africa/Casablanca' },
    { label: 'Africa/Algiers (+1)', value: 'Africa/Algiers' },
    { label: 'Africa/Tunis (+1)', value: 'Africa/Tunis' },
    { label: 'Africa/Addis Ababa (+3)', value: 'Africa/Addis_Ababa' },
    { label: 'Africa/Accra (+0)', value: 'Africa/Accra' },
    { label: 'Africa/Dakar (+0)', value: 'Africa/Dakar' },
    { label: 'Australia/Sydney (+10/+11)', value: 'Australia/Sydney' }
  ];

  const llmTypeOptions = [
    { label: 'Claude', value: 'CLAUDE' },
    /*{ label: 'OpenAI', value: 'OPENAI' },*/
    { label: 'Groq', value: 'GROQ' }
  ];

  const mergerMethodOptions = [
    { label: 'Intro Song', value: 'INTRO_SONG' }
  ];

  const variableOptions = ref<Array<{label: string, value: string}>>([
    { label: 'ai_dj_name', value: 'ai_dj_name' },
    { label: 'brand', value: 'brand' },
    { label: 'title', value: 'title' },
    { label: 'artist', value: 'artist' },
    { label: 'listeners', value: 'listeners' },
    { label: 'context', value: 'context' },
    { label: 'history', value: 'history' },
    { label: 'messages', value: 'messages' },
    { label: 'events', value: 'events' },
    { label: 'genres', value: 'genres' },
    { label: 'song_description', value: 'song_description' }
  ]);

  const variableSampleData: Record<string, string[]> = {
    ai_dj_name: ['DJ Nova', 'DJ Echo', 'DJ Pulse', 'DJ Orion', 'DJ Lyra'],
    brand: ['KNEO Radio', 'SonicWave FM', 'Urban Beats', 'Galaxy Tunes', 'City Vibes'],
    title: ['Midnight City', 'Blinding Lights', 'Levitating', 'Starboy', 'Get Lucky'],
    artist: ['M83', 'Daft Punk', 'The Weeknd', 'Dua Lipa', 'Coldplay'],
    // Structured list of listeners for prompt testing
    listeners: [
      '[{"name":"Marko","nickname":"","location":"Latvia"},{"name":"Nelson","nickname":"","location":"Portugal"}]',
      '[{"name":"Anna","nickname":"Ann","location":"Germany"},{"name":"Kenji","nickname":"","location":"Japan"}]'
    ],
    // Structured context object
    context: [
      '{"show":"Morning Drive","mood":"upbeat","notes":"News every 30 minutes"}',
      '{"show":"Late Night Chill","mood":"calm","notes":"Lo-fi/ambient"}'
    ],
    // Structured play history
    history: [
      '[{"title":"Get Lucky","artist":"Daft Punk"},{"title":"Blinding Lights","artist":"The Weeknd"},{"title":"Levitating","artist":"Dua Lipa"}]',
      '[{"title":"Yellow","artist":"Coldplay"},{"title":"Starboy","artist":"The Weeknd"}]'
    ],
    messages: [
      'Shoutout to Anna from Berlin! Can you play something from Dua Lipa?',
      'Loving the vibe! Greetings from Lisbon!',
      'Request: Any classic Daft Punk track please.'
    ],
    // Structured events list
    events: [
      '[{"type":"weather","text":"Clear skies, 22°C"},{"type":"traffic","text":"Slow on A2 near exit 5"}]',
      '[{"type":"promo","text":"Giveaway at :00"},{"type":"local","text":"Food festival 17:00 Central Park"}]'
    ],
    // Prefer array-style string for genres to drop-in to JSON prompts
    genres: [
      '["pop","electronic"]',
      '["indie","electronic"]',
      '["rock"]'
    ],
    song_description: [
      'An energetic synth-pop track with bright hooks and a driving beat, perfect for late-night vibes.',
      'A mellow indie ballad with warm vocals and lo-fi textures, ideal for a calm evening set.',
      'A high-tempo electronic banger with punchy bass and crisp percussion, club-ready.',
      'A soulful pop tune featuring smooth vocals and a catchy, radio-friendly chorus.'
    ]
  };

  const bitRateOptions = [
    { value: 128000, label: "128 kbps" },
    { value: 192000, label: "192 kbps" },
    { value: 320000, label: "320 kbps" }
  ];

  const getLocalThemeOverrides = (isDark: boolean) => {
    return isDark
      ? {
        common: {
          cardColor: '#242424',
          modalColor: '#242424',
          popoverColor: '#242424',
          inputColor: '#2a2a2a',
          inputColorDisabled: '#2a2a2a',
          borderColor: '#4a4a4a'
        },
        Input: {
          color: '#2a2a2a',
          colorFocus: '#2a2a2a',
          borderColor: '#4a4a4a',
          borderHoverColor: '#4d4d4d',
          borderFocusColor: '#5aa2f7',
          borderColorDisabled: '#4a4a4a',
          colorDisabled: '#2a2a2a',
          textColorDisabled: '#a0a0a0',
          placeholderColorDisabled: '#777'
        },
        Select: {
          borderColor: '#4a4a4a',
          borderHoverColor: '#4d4d4d',
          borderFocusColor: '#5aa2f7'
        }
      }
      : {}
  };

  return {
    countryOptions,
    languageOptions,
    voiceOptions,
    timezones,
    genreOptions,
    eventTypeOptions,
    llmTypeOptions,
    mergerMethodOptions,
    variableOptions,
    variableSampleData,
    bitRateOptions,
    audioAcceptTypes,
    musicUploadAgreement,
    messagePostingAgreement,
    getLocalThemeOverrides,
    fetchGenres,
    fetchVoices,
    fetchDictionary,
    fetchRadioStations
  };
});