<template>
  <div class="lesson-list">
    <LessonListItem 
      v-for="lesson in lessons" 
      :key="lesson.id" 
      :lesson="lesson"
      @update-quantity="handleUpdateQuantity"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LessonListItem from './LessonListItem.vue';

const lessons = ref([]);

const fetchLessons = async () => {
  try {
    const response = await fetch('http://localhost:3000/lessons');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    lessons.value = await response.json();
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
};

const handleUpdateQuantity = (payload) => {
  console.log('Quantity updated:', payload);
  // Here you can add logic to handle the updated quantity,
  // for example, by updating a shopping cart.
};

onMounted(() => {
  fetchLessons();
});
</script>

<style scoped>
.lesson-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
