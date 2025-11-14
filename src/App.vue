<script setup>
import { ref, onMounted } from 'vue';
import LessonListItem from './components/LessonListItem.vue';

const isDarkMode = ref(false);

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
};

onMounted(() => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDarkMode.value = true;
    document.body.classList.add('dark');
  }
});
</script>

<template>
  <div class="theme-switcher">
    <button @click="toggleTheme" class="btn">
      {{ isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}
    </button>
  </div>
  <LessonListItem
    :lesson="{
      id: 11,
      subject: 'Music Theory',
      location: 'Brent Cross',
      price: 85,
      spaces: 5,
      image: 'https://www.redbubble.com/frontend-static/error/artwork.jpg'
    }"
  />
</template>

<style scoped>
.theme-switcher {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.btn {
    height: 42px;
    padding: 0.5rem 1.5rem;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: bold;
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    transition: var(--transition);
}

.btn:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
}
</style>
