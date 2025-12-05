<!-- LessonList: Displays grid of lesson cards with loading/error states -->
<template>
  <section class="lesson-list">
    <!-- Loading State -->
    <p v-if="isLoading" class="lesson-list__status">Loading lessons...</p>
    <!-- Error State -->
    <p v-else-if="errorMessage" class="lesson-list__status lesson-list__status--error">
      {{ errorMessage }}
    </p>
    <!-- Empty State -->
    <p v-else-if="!lessons.length" class="lesson-list__status">No lessons match your criteria.</p>

    <!-- Lesson Grid -->
    <div class="lesson-list__grid">
      <LessonListItem v-for="lesson in lessons" :key="lesson.id" :lesson="lesson"
        @add-to-cart="$emit('add-to-cart', lesson.id)" @decrement="$emit('decrement-lesson', $event)" />
    </div>
  </section>
</template>

<script setup>
import LessonListItem from './LessonListItem.vue';

// Props for lesson data and loading states
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

// Events emitted to parent for cart actions
defineEmits(['add-to-cart', 'decrement-lesson']);
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
