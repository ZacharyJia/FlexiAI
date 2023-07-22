<template>
  <div class="chat-container">
    <q-scroll-area
      class="messages-container"
      ref="messagesContainer"
    >
      <q-chat-message
        style="padding-left: 10px; padding-right: 20px"
        :key="index"
        v-for="(message, index) in chatStore.chats[chatId]"
        :sent="message.role === 'user'"
        text-html
        :text="[md.render(message.content)]"
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


<script setup lang="js">
import {onMounted, ref} from 'vue';
import MarkdownIt from 'markdown-it';
import {v4 as uuidv4} from 'uuid';
import {useChatStore} from "stores/chat-store";

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

const chatId = uuidv4();
console.log(chatId);

const messages = ref();

onMounted(() => {
  messages.value = [
    // { sent: false, text: '你好，我是你的机器人助理，有什么可以帮你的？' },
    // { sent: false, text: 'I am **fine**, thanks.' },
    // { sent: true, text: 'What have you been up to?' },
    // { sent: false, text: 'Nothing much, just hanging out.' },
  ];
})

const chatStore = useChatStore();
chatStore.chats[chatId] = [
  { role: 'assistant', content: '你好，我是你的机器人助理，请问有什么可以帮你的？' },
];

const newMessage = ref('');

const messagesContainer = ref();
const waitingResponse = ref(false);

const sendMessage = (e) => {
  if (waitingResponse.value) {
    return;
  }
  if (e.keyCode === 13 && newMessage.value.trim()) {

    pywebview.api.send_msg(chatId, chatStore.chats[chatId], newMessage.value);
    waitingResponse.value = true;

    chatStore.chats[chatId].push({ role: 'user', content: newMessage.value });
    chatStore.chats[chatId].push({ role: 'assistant', content: '' });


    newMessage.value = '';

    setTimeout(() => {
      messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
    }, 110);

  }
  return false;
};

window.onMsgEnd = (targetChatId) => {
  if (targetChatId !== chatId) {
    return;
  }

  setTimeout(() => {
    messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
  }, 110);

  waitingResponse.value = false;
}


// window.FlexiAI.on('NotifyChatResponseDelta', (event, data) => {
//   waitingResponse.value = true;
//   // console.log('NotifyChatResponse', data);
//   setTimeout(() => {
//     messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
//   }, 110);
//   currentResponse.value += data.content;
// });
//
// window.FlexiAI.on('NotifyChatResponseDone', () => {
//   console.log('NotifyChatResponseEnd');
//   console.log(currentResponse.value);
//   waitingResponse.value = false;
//   messages.value.push({ sent: false, text: currentResponse.value });
//   currentResponse.value = '';
// });

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
