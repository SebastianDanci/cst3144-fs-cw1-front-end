<template>
  <section class="lesson-list">
    <p v-if="isLoading" class="lesson-list__status">Loading lessons...</p>
    <p v-else-if="errorMessage" class="lesson-list__status lesson-list__status--error">
      {{ errorMessage }}
    </p>
    <p v-else-if="!lessons.length" class="lesson-list__status">No lessons match your criteria.</p>

    <div class="lesson-list__grid">
      <LessonListItem
        v-for="lesson in lessons"
        :key="lesson.id"
        :lesson="lesson"
        @add-to-cart="$emit('add-to-cart', lesson.id)"
      />
    </div>
  </section>
</template>

<script setup>
import LessonListItem from './LessonListItem.vue';

defineProps({
  lessons: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
});

defineEmits(['add-to-cart']);
</script>

<style scoped>
.lesson-list {
  width: 100%;
}

.lesson-list__status {
  text-align: center;
  margin-bottom: 1rem;
  color: var(--color-text-soft);
}

.lesson-list__status--error {
  color: #ef4444;
}

.lesson-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
}
</style>
