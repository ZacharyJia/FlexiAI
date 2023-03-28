import {defineStore} from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => {
    return {
      userConfig: {
        apiKey: '',
        proxy: {
          enabled: false,
          type: 'http',
          host: '',
          port: 0,
        }
      }
    }
  },
  getters: {
  },
  actions: {
    loadConfig() {
      this.userConfig = window.FlexiAI.sendSync('loadConfig');
    }
  },
});
