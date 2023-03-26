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
    loadConfig() {
      const config = window.FlexiAI.sendSync('loadConfig');
      this.apiKey = config.apiKey;
    }
  },
});
