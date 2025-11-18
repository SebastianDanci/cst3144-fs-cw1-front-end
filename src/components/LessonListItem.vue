<template>
    <article class="lesson-card">
        <img :src="optimizedImageUrl" :alt="lesson.subject" class="lesson-card__image" loading="lazy" decoding="async" />
        <div class="lesson-card__body">
            <div>
                <p class="lesson-card__meta">#{{ lesson.id }}</p>
                <h3 class="lesson-card__title">{{ lesson.subject }}</h3>
                <p><strong>Location:</strong> {{ lesson.location }}</p>
                <p><strong>Price:</strong> £{{ lesson.price.toFixed(2) }}</p>
                <p><strong>Spaces Available:</strong> {{ lesson.spaces }}</p>
            </div>
            <button
                class="btn"
                :disabled="lesson.spaces === 0"
                @click="$emit('add-to-cart', lesson.id)"
            >
                {{ lesson.spaces === 0 ? 'Sold Out' : 'Add to Cart' }}
            </button>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue';
import { optimizeImage } from '../image-optimizer.js';

const props = defineProps({
    lesson: {
        type: Object,
        required: true,
        validator: (value) => ['id', 'subject', 'location', 'price', 'spaces', 'image'].every((key) => key in value)
    }
});



const optimizedImageUrl = computed(() => optimizeImage(props.lesson.image));
</script>

<style scoped>
.lesson-card {
    display: flex;
    flex-direction: column;
    background-color: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    transition: var(--transition);
}

.lesson-card:hover {
    transform: translateY(-4px);
}

.lesson-card__image {
    width: 100%;
    height: 220px;
    object-fit: cover;
}

.lesson-card__body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.25rem;
    gap: 1rem;
    min-height: 250px;
}

.lesson-card__title {
    margin: 0.15rem 0 0.75rem;
    font-size: 1.4rem;
}

.lesson-card__meta {
    font-size: 0.85rem;
    color: var(--color-text-mute);
}

.lesson-card__body p {
    margin: 0.15rem 0;
    color: var(--color-text-soft);
}

.btn {
    align-self: flex-start;
    padding: 0.65rem 1.5rem;
    border-radius: var(--border-radius);
    border: none;
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
}

.btn:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
}

.btn:disabled {
    background-color: var(--color-disabled);
    color: var(--color-disabled-text);
    cursor: not-allowed;
}
</style>

    min-width: 180px;
