<!-- LessonListItem: Individual lesson card with add to cart functionality -->
<template>
    <article class="lesson-card">
        <!-- Lesson Image -->
        <img :src="optimizedImageUrl" :alt="lesson.subject" class="lesson-card__image" loading="lazy"
            decoding="async" />
        <div class="lesson-card__body">
            <!-- Lesson Details -->
            <div>
                <p class="lesson-card__meta">#{{ lesson.displayId ?? lesson.id }}</p>
                <h3 class="lesson-card__title">{{ lesson.subject }}</h3>
                <p><strong>Location:</strong> {{ lesson.location }}</p>
                <p><strong>Price:</strong> £{{ lesson.price.toFixed(2) }}</p>
                <p><strong>Spaces Available:</strong> {{ lesson.availableSpaces }}</p>
            </div>
            <!-- Cart Actions -->
            <div class="lesson-card__actions">
                <div v-if="lesson.reserved > 0" class="lesson-card__quantity">
                    <button class="btn btn-secondary btn-sm" type="button" :disabled="lesson.reserved === 0"
                        v-on:click="$emit('decrement', lesson.id)">
                        -
                    </button>
                    <span class="lesson-card__quantity-value">{{ lesson.reserved }}</span>
                    <button class="btn btn-secondary btn-sm" type="button" :disabled="lesson.availableSpaces === 0"
                        v-on:click="$emit('add-to-cart', lesson.id)">
                        +
                    </button>
                </div>

                <button class="btn btn-primary" type="button" :disabled="lesson.availableSpaces === 0"
                    v-on:click="$emit('add-to-cart', lesson.id)">
                    Add to Cart
                </button>

                <span v-if="lesson.spaces === 0" class="lesson-card__sold-out">Sold Out</span>
            </div>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue';
import { optimizeImage } from '../image-optimizer.js';

// Lesson prop with validation
const props = defineProps({
    lesson: {
        type: Object,
        required: true,
        validator: (value) => ['id', 'subject', 'location', 'price', 'spaces', 'image', 'reserved', 'availableSpaces'].every((key) => key in value)
    }
});

// Events for cart interactions
defineEmits(['add-to-cart', 'decrement']);

// Optimized image URL for performance
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

.lesson-card__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.lesson-card__quantity {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--color-background-mute);
    border-radius: var(--border-radius);
    padding: 0.35rem 0.6rem;
}

.lesson-card__quantity-value {
    min-width: 2rem;
    text-align: center;
    font-weight: 600;
}

.lesson-card__sold-out {
    padding: 0.4rem 0.75rem;
    border-radius: var(--border-radius);
    background-color: rgba(239, 68, 68, 0.1);
    color: #b91c1c;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
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
</style>
