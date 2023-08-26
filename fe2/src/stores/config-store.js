import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => {
    return {
      apiKey: '',
    }
  },
  getters: {
  },
  actions: {
    async loadConfig() {
      const config = await pywebview.api.load_config();
      this.apiKey = config.apiKey;
    }
  },
});
