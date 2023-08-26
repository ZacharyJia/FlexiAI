<template>
  <div style="display: flex; flex-direction: column; height: 100%" ref="parent">
    <q-scroll-area ref="scrollArea" :style="styleFn()">
      <q-list bordered style="">
        <q-item
          v-for="(p, index) in promptList"
          clickable
          v-bind:key="index"
          :focused="currentIndex === index"
          @click="handleClickPromptList(index)"
          :ref="(el) => (itemRefs[index] = el)"
        >
          <q-item-section avatar>
            <q-icon color="primary" :name="p.icon" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ p.title }}</q-item-label>
            <q-item-label caption>{{ p.desc }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script setup lang="js">
import {ref, nextTick, onMounted, watch} from 'vue';

const props = defineProps({
  promptList: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:selectedPrompt', 'clickPrompt'])


const currentIndex = ref(0);

watch(() => props.promptList, () => {
  currentIndex.value = 0;
  scrollToSelected();
  emit('update:selectedPrompt', props.promptList[currentIndex.value]);
})

onMounted(() => {
  scrollToSelected();
  emit('update:selectedPrompt', props.promptList[currentIndex.value]);
})

const styleFn = () => {
  return "height: " + 50 * props.promptList.length + "px; margin-top: auto;"
}



const handleClickPromptList = (idx) => {
  console.log('click', idx)
  currentIndex.value = idx;
  emit('update:selectedPrompt', props.promptList[currentIndex.value]);
  emit('clickPrompt', false);
}

const scrollArea = ref(null);

const parent = ref(null);

const scrollToSelected = () => {
  nextTick(() => {
    const selectedItem = itemRefs[currentIndex.value];
    if (selectedItem) {
      const offset = selectedItem.offsetTop;

      scrollArea.value.setScrollPosition('vertical', currentIndex.value * 49)
    }
  });
};


const moveUp = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
    scrollToSelected();
    emit('update:selectedPrompt', props.promptList[currentIndex.value]);
  }
}

const moveDown = () => {
  if (currentIndex.value < props.promptList.length - 1) {
    currentIndex.value += 1;
    scrollToSelected();
    emit('update:selectedPrompt', props.promptList[currentIndex.value]);
  }
}

const itemRefs = [];




defineExpose({
  moveUp,
  moveDown
})
</script>
