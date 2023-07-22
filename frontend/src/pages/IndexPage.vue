<template>
  <q-page class="row items-center justify-evenly">
    <chat-component
      active
    ></chat-component>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import ChatComponent from 'components/ChatComponent.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {ChatComponent}
})
</script>
