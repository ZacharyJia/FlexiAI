<template>
  <div class="chat-container">
    <q-scroll-area
      class="messages-container"
      ref="messagesContainer"
    >
      <q-chat-message
        style="padding-left: 10px; padding-right: 20px"
        :sent="false"
        text-html
        :text="[md.render('你好，我是你的机器人助理，请问有什么可以帮你的？')]"
      />
      <q-chat-message
        style="padding-left: 10px; padding-right: 20px"
        :key="index"
        v-for="(message, index) in messages"
        :sent="message.sent"
        text-html
        :text="[md.render(message.text)]"
      />
      <q-chat-message
        v-if="currentResponse !== ''"
        style="padding-left: 10px; padding-right: 20px"
        :sent="false"
        text-html
        :text="[md.render(currentResponse)]"
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
        <q-btn color="primary" icon-right="send" flat size="md" :disable="waitingResponse" @click="sendMessage" />
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
    // { sent: false, text: '你好，我是你的机器人助理，有什么可以帮你的？' },
    // { sent: false, text: 'I am **fine**, thanks.' },
    // { sent: true, text: 'What have you been up to?' },
    // { sent: false, text: 'Nothing much, just hanging out.' },
  ];
})

const newMessage = ref('');

const messagesContainer = ref();
const waitingResponse = ref(false);

const sendMessage = (e: KeyboardEvent) => {
  if (waitingResponse.value) {
    return;
  }
  if (e.keyCode === 13 && newMessage.value.trim()) {
    window.FlexiAI.send('sendMsg', newMessage.value, JSON.parse(JSON.stringify(messages.value)).map((item: any) => {
      return {
        role: item.sent ? 'user' : 'assistant',
        content: item.text
      }
    }));

    messages.value.push({ sent: true, text: newMessage.value });
    newMessage.value = '';

    setTimeout(() => {
      messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
    }, 110);

  }
  return false;
};

const currentResponse = ref('');

window.FlexiAI.on('NotifyChatResponseDelta', (event, data) => {
  waitingResponse.value = true;
  // console.log('NotifyChatResponse', data);
  setTimeout(() => {
    messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
  }, 110);
  currentResponse.value += data.content;
});

window.FlexiAI.on('NotifyChatResponseDone', () => {
  waitingResponse.value = false;
  // console.log('NotifyChatResponseEnd');
  messages.value.push({ sent: false, text: currentResponse.value });
  currentResponse.value = '';
});

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
