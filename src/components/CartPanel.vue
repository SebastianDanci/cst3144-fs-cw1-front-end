<!-- CartPanel: Shopping cart with checkout form -->
<template>
  <section class="cart-panel">
    <!-- Cart Header -->
    <header class="cart-panel__header">
      <div>
        <p class="cart-panel__eyebrow">EZLessons</p>
        <h2>Shopping Cart</h2>
        <p v-if="cartItems.length" class="cart-panel__count">{{ cartItems.length }} lesson(s) selected</p>
      </div>
      <button class="btn btn-secondary btn-sm" type="button" @click="$emit('close-cart')">
        ← Back to lessons
      </button>
    </header>

    <!-- Empty Cart State -->
    <div v-if="!cartItems.length" class="cart-panel__empty">
      <p>Your cart is empty. Add lessons from the list to get started.</p>
      <button class="btn btn-primary btn-sm" type="button" @click="$emit('close-cart')">Browse lessons</button>
    </div>

    <!-- Cart Items List -->
    <div v-else class="cart-panel__items">
      <article v-for="item in cartItems" :key="item.lessonId" class="cart-item">
        <div class="cart-item__media">
          <img :src="optimizeImage(item.image)" :alt="item.subject" class="cart-item__thumb" loading="lazy"
            decoding="async" />
        </div>
        <div class="cart-item__details">
          <h3>{{ item.subject }}</h3>
          <p class="cart-item__meta">{{ item.location }}</p>
          <p class="cart-item__price">£{{ item.price.toFixed(2) }} each</p>
        </div>
        <div class="cart-item__actions">
          <div class="quantity-control">
            <button class="btn btn-secondary btn-sm" type="button" :disabled="item.quantity <= 1"
              @click="$emit('update-quantity', { lessonId: item.lessonId, quantity: item.quantity - 1 })">
              -
            </button>
            <span class="quantity-display">{{ item.quantity }}</span>
            <button class="btn btn-secondary btn-sm" type="button" :disabled="item.quantity >= item.maxAvailable"
              @click="$emit('update-quantity', { lessonId: item.lessonId, quantity: item.quantity + 1 })">
              +
            </button>
          </div>
          <button class="btn btn-link" type="button" @click="$emit('remove-item', item.lessonId)">Remove</button>
        </div>
      </article>
    </div>

    <!-- Cart Footer with Summary and Checkout Form -->
    <footer class="cart-panel__footer">
      <!-- Order Total -->
      <div class="cart-summary">
        <p><strong>Total:</strong> £{{ total.toFixed(2) }}</p>
      </div>

      <!-- Checkout Form -->
      <form class="checkout-form" @submit.prevent="submitOrder">
        <label class="checkout-form__field">
          Name
          <input v-model="name" type="text" placeholder="Jane Doe" :class="{ 'input-invalid': name && !isNameValid }"
            :aria-invalid="name && !isNameValid" autocomplete="name" />
          <small v-if="name && !isNameValid" class="field-error">Letters and spaces only.</small>
        </label>

        <label class="checkout-form__field">
          Phone
          <input v-model="phone" type="text" inputmode="numeric" placeholder="07123456789"
            :class="{ 'input-invalid': phone && !isPhoneValid }" :aria-invalid="phone && !isPhoneValid"
            autocomplete="tel" />
          <small v-if="phone && !isPhoneValid" class="field-error">Phone number must be at least 2 digits.</small>
        </label>

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

// Props for cart data and checkout state
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

// Events for cart actions
const emit = defineEmits(['update-quantity', 'remove-item', 'checkout', 'close-cart']);

// Form state
const name = ref('');
const phone = ref('');

// Form validation
const isNameValid = computed(() => /^[a-zA-Z\s]+$/.test(name.value.trim()));
const isPhoneValid = computed(() => /^\d{2,}$/.test(phone.value.trim()));

// Check if form is ready to submit
const canCheckout = computed(() => props.cartItems.length > 0 && isNameValid.value && isPhoneValid.value && !props.isSubmitting);

// Submit order handler
const submitOrder = () => {
  if (!canCheckout.value) {
    return;
  }
  emit('checkout', { name: name.value.trim(), phone: phone.value.trim() });
};

// Reset form when cart is emptied
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
  padding: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: var(--color-background-soft);
}

.cart-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.cart-panel__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: var(--color-text-mute);
  margin-bottom: 0.25rem;
}

.cart-panel__count {
  color: var(--color-text-soft);
  margin-top: 0.25rem;
}

.cart-panel__empty {
  text-align: center;
  padding: 2rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.cart-panel__items {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cart-item {
  display: grid;
  grid-template-columns: minmax(140px, 200px) 1fr auto;
  gap: 1.25rem;
  align-items: stretch;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: var(--color-background);
  box-shadow: var(--shadow);
  min-height: 160px;
}

.cart-item__media {
  position: relative;
  overflow: hidden;
  border-radius: calc(var(--border-radius) * 0.8);
  border: 1px solid var(--color-border);
}

.cart-item__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 140px;
}

.cart-item__details {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  justify-content: center;
}

.cart-item__details h3 {
  margin: 0;
}

.cart-item__meta {
  color: var(--color-text-soft);
  margin: 0.15rem 0;
}

.cart-item__price {
  font-weight: 600;
}

.cart-item__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  justify-content: space-between;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-display {
  min-width: 2rem;
  text-align: center;
  font-weight: 600;
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
}

.checkout-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.checkout-form__field .field-error {
  display: block;
  width: 100%;
}

.cart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: var(--color-background);
}

@media (max-width: 640px) {
  .cart-item {
    grid-template-columns: 1fr;
  }

  .cart-item__media {
    height: 180px;
  }

  .cart-item__actions {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
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
