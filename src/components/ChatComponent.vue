<template>
  <div class="chat-container">
    <q-scroll-area
      class="messages-container"
      ref="messagesContainer"
    >
      <q-chat-message
        style="padding-left: 10px; padding-right: 20px"
        :key="index"
        v-for="(message, index) in messages"
        :sent="message.sent"
        text-html
        :text="[md.render(message.text)]"
      />
    </q-scroll-area>
    <div class="input-container">
      <q-input
        v-model="newMessage"
        @keydown.enter.shift="()=>{}"
        @keydown.enter.exact.prevent.stop="sendMessage"
        placeholder="输入消息"
        type="textarea"
        autogrow
        dense
        style="width: 100%" />
      <div class="self-end">
        <q-btn color="primary" icon-right="send" flat size="md" @click="sendMessage" />
      </div>
    </div>
  </div>

</template>


<script setup lang="ts">
import {onMounted, ref} from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  breaks: true
});

// interface Props {
//   title: string;
//   todos?: Todo[];
//   meta: Meta;
//   active: boolean;
// }
// const props = withDefaults(defineProps<Props>(), {
//   todos: () => [],
// });

const messages = ref();

onMounted(() => {
  messages.value = [
    { sent: true, text: 'Hello, how are you?' },
    { sent: false, text: 'I am **fine**, thanks.' },
    { sent: true, text: 'What have you been up to?' },
    { sent: false, text: 'Nothing much, just hanging out.' },
  ];
})

const newMessage = ref('');

const messagesContainer = ref();

const sendMessage = (e: KeyboardEvent) => {
  if (e.keyCode === 13 && newMessage.value.trim()) {
    messages.value.push({ sent: true, text: newMessage.value });
    newMessage.value = '';

    setTimeout(() => {
      messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
    }, 110);
  }
  return false;
};

</script>


<style scoped>

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 10px;
  flex: 1;
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}


.input-container {
  display: flex;
  align-items: center;
  margin-top: 10px;
  width: 100%;
}

.input-container .q-input {
  flex: 1;
  margin-right: 10px;
  display: flex;
}

.input-container .q-btn {
  /*min-width: 100px;*/
}

</style>

<style>
.messages-container .q-scrollarea__container {
  flex: 1;
}
</style>
