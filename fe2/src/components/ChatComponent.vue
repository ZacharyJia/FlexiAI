<template>
  <div class="chat-container">
    <q-scroll-area class="messages-container" ref="messagesContainer">
      <q-chat-message
        style="padding-left: 10px; padding-right: 20px; max-width: 100%"
        :key="index"
        v-for="(message, index) in chatStore.chats[chatId]"
        :sent="message.role === 'user'"
        text-html
        :text="[md.render(message.content)]"
        size="12"
      >
        <template v-slot:name>
          <div style="display: flex; flex-direction: row">
            <q-btn
              round
              flat
              color="primary"
              icon="content_copy"
              size="xs"
              @click="copyToClipboard(message.content)"
            >
              <q-tooltip> 复制文本 </q-tooltip>
            </q-btn>
            <q-btn
              round
              flat
              color="primary"
              icon="edit"
              size="xs"
              @click="replaceText(message.content)"
            >
              <q-tooltip> 复制并替换文本 </q-tooltip>
            </q-btn>
          </div>
        </template>
      </q-chat-message>
    </q-scroll-area>
    <div style="padding: 5px; border-radius: 8px">
      <div v-show="promptListShow">
        <PromptList
          :promptList="filterPromptList()"
          @update:selectedPrompt="(val) => (selectedPrompt = val)"
          ref="promptListComponent"
          v-on:clickPrompt="performAction"
          style="height: 150px"
        />
      </div>

      <q-chip
        removable
        v-model="useClipboardContent"
        icon="content_paste_go"
        :label="clipboardContent"
        :title="clipboardContent"
        color="orange-6"
        text-color="white"
      />

      <div class="input-container">
        <q-input
          ref="inputComponent"
          v-model="newMessage"
          @keydown.enter.shift="() => {}"
          @keydown.enter.exact.prevent.stop="handleEnterDown"
          placeholder="输入消息"
          type="textarea"
          autogrow
          style="width: 100%"
          dense
          outlined
          @keydown="handleKeyDown"
          @update:model-value="handleTextChange"
        >
        </q-input>
        <div class="self-end">
          <q-btn
            color="primary"
            icon-right="send"
            flat
            size="md"
            :disable="waitingResponse"
            @click="sendMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="js">
import {onMounted, ref} from 'vue';
import MarkdownIt from 'markdown-it';
import {v4 as uuidv4} from 'uuid';
import {useChatStore} from "stores/chat-store";
import PromptList from "components/PromptList.vue";
import { encode, decode } from 'js-base64';
import { useQuasar } from 'quasar'

const $q = useQuasar();

const md = new MarkdownIt({
  breaks: true
});

const inputComponent = ref(null);

const ensureUseClipboard = () => {
  if (!useClipboardContent.value) {
    $q.notify({
      icon: 'warning',
      message: '没有可用的剪贴板文本!',
      position: 'top',
      color: 'warning',
    })
    return false;
  }
  return true;
}

const promptList = [
  {
    id: 'translate-to-cn',
    icon: 'g_translate',
    title: '翻译为中文',
    desc: '翻译当前选中的文本至中文',
    action: () => {
      if (ensureUseClipboard()) {
        newMessage.value = '将以下文本翻译为中文: \n' + clipboardContent.value;
        sendMessage({keyCode: 13});
      }
    }
  },
  {
    id: 'translate-to-en',
    title: '翻译为英文',
    icon: 'g_translate',
    desc: '翻译当前选中的文本至英文',
    action: () => {
      if (ensureUseClipboard()) {
        newMessage.value = '将以下文本翻译为英文: \n' + clipboardContent.value;
        sendMessage({keyCode: 13});
      }
    }
  },
  {
    id: 'explain',
    title: '解释',
    icon: 'menu_book',
    desc: '解释当前选中的文本',
    action: () => {
      if (ensureUseClipboard()) {
        newMessage.value = '解释以下文本: \n' + clipboardContent.value;
        sendMessage({keyCode: 13});
      }
    }
  },
  {
    id: 'code',
    title: '写代码',
    icon: 'code',
    desc: '根据当前选中的文本输出代码',
    action: () => {
      if (ensureUseClipboard()) {
        newMessage.value = '根据下列要求，写出对应的代码: \n' + clipboardContent.value;
        sendMessage({keyCode: 13});
      }
    }
  },
  {
    id: 'summarize',
    title: '总结',
    icon: 'summarize',
    desc: '总结当前选中的文本',
    action: () => {
      if (ensureUseClipboard()) {
        newMessage.value = '总结以下文本: \n' + clipboardContent.value;
        sendMessage({keyCode: 13});
      }
    }
  },
  {
    id: 'clipboard',
    title: '使用剪贴板',
    icon: 'content_paste_go',
    desc: '使用剪贴板内容',
    condition: () => {
      return !useClipboardContent.value;
    },
    action: () => {
      useClipboardContent.value = true;
      newMessage.value = '/';
    }
  },
  {
    id: 'hide',
    title: '隐藏',
    icon: 'exit_to_app',
    desc: '关闭当前窗口',
    action: () => {
      pywebview.api.hide_window()
    }
  }
]

window.onClipboardUpdate = (content) => {
  console.log('onClipboardUpdate', content);
  clipboardContent.value = decode(content);;
  inputComponent.value.focus();
  reset();

}

const selectedPrompt = ref(null);
const promptListComponent = ref(null);


const chatId = ref(uuidv4());
console.log(chatId.value);


onMounted(async () => {
  // clipboardContent.value = await pywebview.api.get_clipboard();
})

const chatStore = useChatStore();
chatStore.chats[chatId.value] = [
  // { role: 'assistant', content: '你好，我是你的机器人助理，请问有什么可以帮你的？' },
];

const newMessage = ref('');

const messagesContainer = ref();
const waitingResponse = ref(false);

const clipboardContent = ref('');
const useClipboardContent = ref(true);

const promptListShow = ref(false);

const handleKeyDown = (e) => {
  console.log(e.keyCode);
  if (e.keyCode === 38) {
    // up
    promptListComponent.value.moveUp();
    e.preventDefault();
  } else if (e.keyCode === 40) {
    // down
    promptListComponent.value.moveDown();
    e.preventDefault();
  } else if (e.keyCode === 27) {
    // esc
    if (newMessage.value.trim() === '') {
      pywebview.api.hide_window();
    } else {
      newMessage.value = '';
      promptListShow.value = false;
    }
  }
}

const handleTextChange = (val) => {
  if (val.startsWith('/')) {
    promptListShow.value = true;
  } else {
    promptListShow.value = false;
  }
}

const filterPromptList = () => {
  return promptList.filter(p => {
    return !p.condition || p.condition();
  }).filter(p => {
    return (p.title.toLowerCase().includes(newMessage.value.toLowerCase().replace('/', ''))) ||
      (p.desc && p.desc.toLowerCase().includes(newMessage.value.toLowerCase().replace('/', ''))) ||
      (p.id && p.id.toLowerCase().includes(newMessage.value.toLowerCase().replace('/', '')));
  });
}

const performAction = () => {
  console.log('performAction', selectedPrompt.value);
  if (selectedPrompt.value.action) {
    selectedPrompt.value.action();
  } else {
    newMessage.value = selectedPrompt.value.title;
  }
  promptListShow.value = false;
}


const handleEnterDown = (e) => {
  if (e.keyCode === 13) {
    if (promptListShow.value) {
      performAction();
    } else {
      sendMessage(e);
    }
  }
}

const sendMessage = (e) => {
  if (waitingResponse.value) {
    return;
  }
  if (e.keyCode === 13 && newMessage.value.trim()) {
    console.log(chatStore.chats[chatId.value])
    console.log(chatId.value, chatStore.chats[chatId.value], newMessage.value);
    if (chatStore.chats[chatId.value].length === 0) {
      pywebview.api.send_msg(chatId.value, [], newMessage.value);
    } else {
      pywebview.api.send_msg(chatId.value, chatStore.chats[chatId.value], newMessage.value);
    }

    waitingResponse.value = true;

    chatStore.chats[chatId.value].push({ role: 'user', content: newMessage.value });
    chatStore.chats[chatId.value].push({ role: 'assistant', content: '' });


    newMessage.value = '';

    setTimeout(() => {
      messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
    }, 110);

  }
  return false;
};

window.onMsgEnd = (targetChatId) => {
  if (targetChatId !== chatId.value) {
    return;
  }

  setTimeout(() => {
    messagesContainer.value.setScrollPercentage('vertical', 1.0, 100)
  }, 110);

  waitingResponse.value = false;
}

const reset = () => {
  newMessage.value = '';
  chatId.value = uuidv4();
  chatStore.chats[chatId.value] = [
    // { role: 'assistant', content: '你好，我是你的机器人助理，请问有什么可以帮你的？' },
  ];
}

const copyToClipboard = (content) => {
  pywebview.api.set_clipboard(content);
}

const replaceText = (content) => {
  pywebview.api.replace_text(content);
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
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 5px;
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

.messages-container .q-scrollarea__content {
  width: 100%;
}

.messages-container pre {
  overflow-x: scroll;
}
</style>
