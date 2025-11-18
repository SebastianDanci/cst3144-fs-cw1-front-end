<template>
  <section class="cart-panel">
    <header class="cart-panel__header">
      <h2>Shopping Cart</h2>
      <p v-if="cartItems.length">{{ cartItems.length }} lesson(s) selected</p>
    </header>

    <div v-if="!cartItems.length" class="cart-panel__empty">
      <p>Your cart is empty. Add lessons from the list to get started.</p>
    </div>

    <div v-else class="cart-panel__items">
      <article v-for="item in cartItems" :key="item.lessonId" class="cart-item">
        <img
          :src="optimizeImage(item.image)"
          :alt="item.subject"
          class="cart-item__thumb"
          loading="lazy"
          decoding="async"
        />
        <div class="cart-item__details">
          <h3>{{ item.subject }}</h3>
          <p class="cart-item__meta">{{ item.location }}</p>
          <p>£{{ item.price.toFixed(2) }} each</p>
        </div>
        <div class="cart-item__actions">
          <div class="quantity-control">
            <button
              class="btn"
              :disabled="item.quantity <= 1"
              @click="$emit('update-quantity', { lessonId: item.lessonId, quantity: item.quantity - 1 })"
            >
              -
            </button>
            <span class="quantity-display">{{ item.quantity }}</span>
            <button
              class="btn"
              :disabled="item.quantity >= item.maxAvailable"
              @click="$emit('update-quantity', { lessonId: item.lessonId, quantity: item.quantity + 1 })"
            >
              +
            </button>
          </div>
          <button class="link" @click="$emit('remove-item', item.lessonId)">Remove</button>
        </div>
      </article>
    </div>

    <footer class="cart-panel__footer">
      <div class="cart-summary">
        <p><strong>Total:</strong> £{{ total.toFixed(2) }}</p>
      </div>

      <form class="checkout-form" @submit.prevent="submitOrder">
        <label>
          Name
          <input v-model="name" type="text" placeholder="Jane Doe" />
        </label>
        <small v-if="name && !isNameValid" class="field-error">Letters and spaces only.</small>

        <label>
          Phone
          <input v-model="phone" type="text" inputmode="numeric" placeholder="07123456789" />
        </label>
        <small v-if="phone && !isPhoneValid" class="field-error">Numbers only.</small>

        <button class="btn btn-primary" type="submit" :disabled="!canCheckout">
          {{ isSubmitting ? 'Submitting...' : 'Checkout' }}
        </button>
      </form>

      <p v-if="checkoutMessage" :class="['checkout-status', checkoutMessageType]">
        {{ checkoutMessage }}
      </p>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { optimizeImage } from '../image-optimizer.js';

const props = defineProps({
  cartItems: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  checkoutMessage: {
    type: String,
    default: ''
  },
  checkoutMessageType: {
    type: String,
    default: ''
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update-quantity', 'remove-item', 'checkout']);

const name = ref('');
const phone = ref('');

const isNameValid = computed(() => /^[a-zA-Z\s]+$/.test(name.value.trim()));
const isPhoneValid = computed(() => /^\d+$/.test(phone.value.trim()));

const canCheckout = computed(() => props.cartItems.length > 0 && isNameValid.value && isPhoneValid.value && !props.isSubmitting);

const submitOrder = () => {
  if (!canCheckout.value) {
    return;
  }
  emit('checkout', { name: name.value.trim(), phone: phone.value.trim() });
};

watch(
  () => props.cartItems.length,
  (newLength, oldLength) => {
    if (newLength === 0 && oldLength > 0) {
      name.value = '';
      phone.value = '';
    }
  }
);
</script>

<style scoped>
.cart-panel {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.cart-panel__empty {
  text-align: center;
  padding: 2rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius);
}

.cart-panel__items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.cart-item__thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius);
}

.cart-item__details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cart-item__meta {
  color: var(--color-text-soft);
  margin: 0.15rem 0;
}

.cart-item__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-display {
  min-width: 2rem;
  text-align: center;
}

.cart-panel__footer {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.checkout-form input {
  width: 100%;
  padding: 0.6rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  border: 1px solid transparent;
  background-color: var(--color-background-mute);
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
}

.btn:disabled {
  background-color: var(--color-disabled);
  color: var(--color-disabled-text);
  cursor: not-allowed;
}

.link {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary);
  cursor: pointer;
}

.field-error {
  color: #ef4444;
}

.checkout-status {
  padding: 0.75rem;
  border-radius: var(--border-radius);
}

.checkout-status.success {
  background-color: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.checkout-status.error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}
</style>
