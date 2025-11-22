<template>
  <section class="hero">
    <div class="hero__content">
      <p class="hero__eyebrow">EZLessons</p>
      <h1 class="hero__title">After School Classes</h1>
    </div>
    <div class="hero__actions">
        <button @click="$emit('toggle-theme')" class="btn btn-secondary btn-sm">
            {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
        </button>
    </div>
    <div class="hero__panel">
      <div class="stat-card">
        <p class="stat-card__label">Available lessons</p>
        <p class="stat-card__value">{{ availableLessonsCount }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">Items in cart</p>
        <p class="stat-card__value">{{ cartCount }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">Total ready</p>
        <p class="stat-card__value">£{{ cartTotal.toFixed(2) }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  isDarkMode: Boolean,
  availableLessonsCount: Number,
  cartCount: Number,
  cartTotal: Number
});

defineEmits(['toggle-theme']);
</script>

<style scoped>
.hero {
  display: grid;
  gap: 1rem;
  grid-template-areas:
    'content actions'
    'panel panel';
  grid-template-columns: 1fr auto;
  padding: 1.25rem 1.5rem;
  border-radius: var(--border-radius);
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow);
}

.hero__content {
  grid-area: content;
}

.hero__actions {
    grid-area: actions;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
}

.hero__eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-mute);
}

.hero__title {
  margin: 0.25rem 0 0;
  font-size: 1.8rem;
  line-height: 1.2;
}

.hero__panel {
  grid-area: panel;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  box-shadow: var(--shadow);
}

.stat-card__label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-mute);
}

.stat-card__value {
  margin-top: 0.35rem;
  font-size: 1.5rem;
  font-weight: 700;
}

@media (max-width: 480px) {
    .hero {
        grid-template-areas:
            'content'
            'actions'
            'panel';
        grid-template-columns: 1fr;
    }
    .hero__actions {
        justify-content: flex-start;
    }
}
</style>
