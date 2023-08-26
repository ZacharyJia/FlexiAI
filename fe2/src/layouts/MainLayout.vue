<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <div class="pywebview-drag-region">
        <q-toolbar class="">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="toggleLeftDrawer"
          />

          <q-toolbar-title> Any Helper </q-toolbar-title>

          <div>
            <q-btn
              flat
              dense
              icon="close"
              aria-label="Close"
              @click="hideWindow"
            />
          </div>
        </q-toolbar>
      </div>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <div class="row justify-between" style="margin: 10px">
        <q-btn icon="settings" dense round flat @click="settingDialog = true">
          <q-tooltip>设置</q-tooltip>
        </q-btn>
        <!-- <q-btn icon="create" dense round flat>
          <q-tooltip>开始新对话</q-tooltip>
        </q-btn> -->
      </div>

      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from "vue";
import EssentialLink from "components/EssentialLink.vue";
import { useChatStore } from "stores/chat-store";

const linksList = [
  {
    title: "Docs",
    caption: "quasar.dev",
    icon: "school",
    link: "https://quasar.dev",
  },
  {
    title: "Github",
    caption: "github.com/quasarframework",
    icon: "code",
    link: "https://github.com/quasarframework",
  },
  {
    title: "Discord Chat Channel",
    caption: "chat.quasar.dev",
    icon: "chat",
    link: "https://chat.quasar.dev",
  },
  {
    title: "Forum",
    caption: "forum.quasar.dev",
    icon: "record_voice_over",
    link: "https://forum.quasar.dev",
  },
  {
    title: "Twitter",
    caption: "@quasarframework",
    icon: "rss_feed",
    link: "https://twitter.quasar.dev",
  },
  {
    title: "Facebook",
    caption: "@QuasarFramework",
    icon: "public",
    link: "https://facebook.quasar.dev",
  },
  {
    title: "Quasar Awesome",
    caption: "Community Quasar projects",
    icon: "favorite",
    link: "https://awesome.quasar.dev",
  },
];

export default defineComponent({
  name: "MainLayout",

  components: {
    EssentialLink,
  },

  setup() {
    const leftDrawerOpen = ref(false);

    const hideWindow = () => {
      pywebview.api.hide_window();
    };

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      hideWindow,
    };
  },
});

const chatStore = useChatStore();

window.onChatMsg = (chatId, msgDelta) => {
  if (chatStore.chats[chatId].length > 0) {
    chatStore.chats[chatId][chatStore.chats[chatId].length - 1].content +=
      msgDelta;
    console.log(msgDelta);
  }
};
</script>

<style scoped></style>

<style>
.q-page {
  flex-direction: column;
}
</style>
