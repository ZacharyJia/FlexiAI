<template>
  <q-card>
    <q-card-section>
      <q-input
        label="API Key"
        filled
        dense
        stack-label
        v-model="configStore.userConfig.apiKey"
      />
      <q-toggle
        label="使用代理服务器"
        v-model="configStore.userConfig.proxy.enabled"
      ></q-toggle>
      <q-option-group
        v-model="configStore.userConfig.proxy.type"
        inline
        :disable="!configStore.userConfig.proxy.enabled"
        :options="[
          { label: 'HTTP', value: 'http' },
          { label: 'SOCKS5', value: 'socks5' }
        ]"
      >
      </q-option-group>
      <q-input
        label="代理服务器地址"
        filled
        dense
        stack-label
        :disable="!configStore.userConfig.proxy.enabled"
        v-model="configStore.userConfig.proxy.host"
      />
      <q-input
        label="代理服务器端口"
        filled
        dense
        stack-label
        :disable="!configStore.userConfig.proxy.enabled"
        v-model="configStore.userConfig.proxy.port"
      />

    </q-card-section>

    <q-card-actions align="right">
      <q-btn label="保存" color="primary" @click="saveConfig" />
    </q-card-actions>
  </q-card>


</template>

<script setup lang="ts">

import {useConfigStore} from 'stores/config-store';

const configStore = useConfigStore();

const saveConfig = () => {
  window.FlexiAI.send('saveConfig', JSON.parse(JSON.stringify(configStore.userConfig)));
}
</script>
