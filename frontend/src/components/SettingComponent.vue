<template>
  <q-card>
    <q-card-section>
      <q-input
        label="API Key"
        filled
        dense
        stack-label
        v-model="configStore.apiKey"
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
  window.FlexiAI.send('saveConfig', {
    apiKey: configStore.apiKey,
  });
}
</script>
