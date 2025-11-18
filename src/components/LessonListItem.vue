<template>
    <div class="card">
        <img :src="lesson.image" :alt="lesson.subject" class="card-image" loading="lazy" />
        <div class="card-content">
            <h3 class="card-title">{{ lesson.subject }}</h3>
            <p><strong>Location:</strong> {{ lesson.location }}</p>
            <p><strong>Price:</strong> £{{ lesson.price.toFixed(2) }}</p>
            <p><strong>Spaces Available:</strong> {{ lesson.spaces - quantity }}</p>

            <div class="card-actions">
                <button v-if="quantity === 0" @click="quantity = 1" :disabled="lesson.spaces <= 0"
                    class="btn btn-primary">
                    Add to Cart
                </button>
                <div v-else class="quantity-control">
                    <button @click="quantity--" class="btn">-</button>
                    <input type="number" v-model.lazy.number="quantity" @change="handleInputChange"
                        class="quantity-input" />
                    <button @click="quantity++" :disabled="quantity >= lesson.spaces" class="btn">+</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    lesson: {
        type: Object,
        required: true,
        validator: (v) => ['id', 'subject', 'location', 'price', 'spaces', 'image'].every(key => key in v)
    }
});

const emit = defineEmits(['update-quantity']);

const quantity = ref(0);

const handleInputChange = () => {
    const val = quantity.value;
    if (!Number.isInteger(val) || val < 0) {
        quantity.value = 0;
    } else if (val > props.lesson.spaces) {
        quantity.value = props.lesson.spaces;
    }
};

watch(quantity, (newQuantity) => {
    emit('update-quantity', { lessonId: props.lesson.id, quantity: newQuantity });
});
</script>

<style scoped>
.card {
    display: flex;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    margin: 1rem;
    box-shadow: var(--shadow);
    background-color: var(--color-background-soft);
    transition: var(--transition);
    max-width: 600px;
    width: 100%;
}

.card:hover {
    background-color: var(--color-background-mute);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.card-image {
    width: 200px;
    height: 200px;
    object-fit: cover;
    align-self: center;
    margin: 1rem;
    border-radius: var(--border-radius);
}

.card-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;
}

.card-title {
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1.5rem;
    color: var(--color-text);
}

.card-content p {
    margin: 0.5rem 0;
    color: var(--color-text-soft);
}

.card-actions {
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    min-width: 180px;
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

.btn:disabled {
    background-color: var(--color-disabled);
    border-color: var(--color-disabled);
    color: var(--color-disabled-text);
    cursor: not-allowed;
}

.quantity-control {
    display: flex;
    align-items: center;
}

.quantity-input {
    width: 60px;
    height: 42px;
    text-align: center;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    margin: 0 0.5rem;
    padding: 0.5rem;
    box-sizing: border-box;
    background-color: var(--color-background);
    color: var(--color-text);
}

.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.quantity-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
}

.quantity-control .btn {
    width: 42px;
    padding: 0;
    background-color: var(--color-background-mute);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.quantity-control .btn:hover:not(:disabled) {
    background-color: var(--color-border-hover);
}
</style>
