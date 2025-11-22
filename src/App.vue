<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import LessonList from './components/LessonList.vue';
import CartPanel from './components/CartPanel.vue';

const API_BASE = 'http://localhost:3000';

const isDarkMode = ref(false);
const showCart = ref(false);
const lessons = ref([]);
const cart = ref([]);
const searchQuery = ref('');
const sortField = ref('subject');
const sortOrder = ref('asc');
const isLoadingLessons = ref(false);
const lessonError = ref('');
const checkoutMessage = ref('');
const checkoutMessageType = ref('');
const isSubmitting = ref(false);

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
};

const fetchLessons = async (query = '') => {
  isLoadingLessons.value = true;
  lessonError.value = '';
  try {
    const endpoint = query
      ? `${API_BASE}/search?q=${encodeURIComponent(query)}`
      : `${API_BASE}/lessons`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error('Unable to load lessons.');
    }
    lessons.value = await response.json();
  } catch (error) {
    lessonError.value = error.message || 'Failed to load lessons.';
  } finally {
    isLoadingLessons.value = false;
  }
};

const decoratedLessons = computed(() => {
  return lessons.value.map((lesson) => {
    const cartEntry = cart.value.find((item) => item.lessonId === lesson.id);
    const reserved = cartEntry ? cartEntry.quantity : 0;
    return {
      ...lesson,
      reserved,
      availableSpaces: Math.max(0, lesson.spaces - reserved)
    };
  });
});

const sortedLessons = computed(() => {
  const field = sortField.value;
  const orderFactor = sortOrder.value === 'asc' ? 1 : -1;
  return [...decoratedLessons.value].sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return -1 * orderFactor;
    if (aValue > bValue) return 1 * orderFactor;
    return 0;
  });
});

const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
const cartButtonDisabled = computed(() => cartCount.value === 0 && !showCart.value);

const availableLessonsCount = computed(() =>
  decoratedLessons.value.filter((lesson) => lesson.spaces > 0).length
);

const cartItemsDetailed = computed(() => {
  return cart.value
    .map((item) => {
      const lesson = lessons.value.find((lesson) => lesson.id === item.lessonId);
      if (!lesson) return null;
      return {
        lessonId: item.lessonId,
        subject: lesson.subject,
        location: lesson.location,
        price: lesson.price,
        image: lesson.image,
        quantity: item.quantity,
        maxAvailable: lesson.spaces
      };
    })
    .filter(Boolean);
});

const cartTotal = computed(() =>
  cartItemsDetailed.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const addToCart = (lessonId) => {
  const lesson = lessons.value.find((lesson) => lesson.id === lessonId);
  if (!lesson) return;

  const existing = cart.value.find((item) => item.lessonId === lessonId);
  const currentQty = existing ? existing.quantity : 0;
  if (currentQty >= lesson.spaces) {
    checkoutMessage.value = 'No more spaces available for this lesson.';
    checkoutMessageType.value = 'error';
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.value.push({ lessonId, quantity: 1 });
  }

  checkoutMessage.value = '';
  checkoutMessageType.value = '';
};

const updateCartQuantity = ({ lessonId, quantity }) => {
  const lesson = lessons.value.find((lesson) => lesson.id === lessonId);
  const cartEntry = cart.value.find((item) => item.lessonId === lessonId);
  if (!lesson || !cartEntry) {
    return;
  }

  if (quantity <= 0) {
    cart.value = cart.value.filter((item) => item.lessonId !== lessonId);
    return;
  }

  if (quantity > lesson.spaces) {
    checkoutMessage.value = `Only ${lesson.spaces} spaces available for ${lesson.subject}.`;
    checkoutMessageType.value = 'error';
    return;
  }

  cartEntry.quantity = quantity;
};

const removeCartItem = (lessonId) => {
  cart.value = cart.value.filter((item) => item.lessonId !== lessonId);
};

const decrementLessonFromList = (lessonId) => {
  const cartEntry = cart.value.find((item) => item.lessonId === lessonId);
  if (!cartEntry) {
    return;
  }
  updateCartQuantity({ lessonId, quantity: cartEntry.quantity - 1 });
};

const toggleCartView = () => {
  if (cartButtonDisabled.value) {
    return;
  }
  showCart.value = !showCart.value;
};

const closeCartView = () => {
  showCart.value = false;
};

let searchTimeoutId;
watch(searchQuery, (newQuery) => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId);
  }
  searchTimeoutId = setTimeout(() => fetchLessons(newQuery.trim()), 300);
});

onUnmounted(() => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId);
  }
});

const handleCheckout = async ({ name, phone }) => {
  if (!cart.value.length) {
    return;
  }

  checkoutMessage.value = '';
  checkoutMessageType.value = '';
  isSubmitting.value = true;

  try {
    const payload = {
      name,
      phone,
      items: cart.value.map((item) => ({ lessonId: item.lessonId, quantity: item.quantity }))
    };

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || 'Unable to submit order.');
    }

    await Promise.all(
      payload.items.map(async (item) => {
        const lesson = lessons.value.find((lesson) => lesson.id === item.lessonId);
        if (!lesson) return;
        const updatedSpaces = Math.max(lesson.spaces - item.quantity, 0);
        lesson.spaces = updatedSpaces;
        await fetch(`${API_BASE}/lessons/${item.lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaces: updatedSpaces })
        });
      })
    );

    cart.value = [];
    checkoutMessage.value = 'Order submitted successfully!';
    checkoutMessageType.value = 'success';
    await fetchLessons(searchQuery.value.trim());
  } catch (error) {
    checkoutMessage.value = error.message || 'Checkout failed.';
    checkoutMessageType.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchLessons();
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDarkMode.value = true;
    document.body.classList.add('dark');
  }
});
</script>

<template>
  <div class="app-shell">
    <section class="hero">
      <div class="hero__content">
        <p class="hero__eyebrow">EZLessons</p>
        <h1 class="hero__title">Your shortcut to great tutoring</h1>
        <p class="hero__subtitle">Browse curated lessons, compare prices in real time, and secure your spot in a couple of taps.</p>
        <div class="hero__actions">
          <button @click="toggleTheme" class="btn btn-secondary btn-sm">
            {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
          </button>
        </div>
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

    <section class="controls-panel">
      <div class="controls-panel__field controls-panel__field--grow">
        <label class="form-field form-field--stretch">
          <span class="form-field__label">Search</span>
          <input
            v-model="searchQuery"
            type="search"
            class="input"
            placeholder="Search by subject, location, or price"
          />
        </label>
      </div>

      <div class="controls-panel__field">
        <label class="form-field">
          <span class="form-field__label">Sort Column</span>
          <select v-model="sortField" class="input">
            <option value="subject">Subject</option>
            <option value="location">Location</option>
            <option value="price">Price</option>
            <option value="spaces">Spaces</option>
          </select>
        </label>
      </div>

      <div class="controls-panel__field">
        <label class="form-field">
          <span class="form-field__label">Sort Order</span>
          <select v-model="sortOrder" class="input">
            <option value="asc">Ascending (A-Z / Low-High)</option>
            <option value="desc">Descending (Z-A / High-Low)</option>
          </select>
        </label>
      </div>

      <div class="controls-panel__field controls-panel__field--align-end">
        <button class="btn btn-primary controls-panel__cart" :disabled="cartButtonDisabled" @click="toggleCartView">
          Cart ({{ cartCount }})
        </button>
      </div>
    </section>

    <main>
      <LessonList
        v-if="!showCart"
        :lessons="sortedLessons"
        :is-loading="isLoadingLessons"
        :error-message="lessonError"
        @add-to-cart="addToCart"
        @decrement-lesson="decrementLessonFromList"
      />

      <CartPanel
        v-else
        :cart-items="cartItemsDetailed"
        :total="cartTotal"
        :checkout-message="checkoutMessage"
        :checkout-message-type="checkoutMessageType"
        :is-submitting="isSubmitting"
        @update-quantity="updateCartQuantity"
        @remove-item="removeCartItem"
        @checkout="handleCheckout"
        @close-cart="closeCartView"
      />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero {
  position: relative;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  padding: 1.5rem;
  border-radius: var(--border-radius);
  background: radial-gradient(circle at top right, var(--color-primary) 0%, transparent 55%),
    linear-gradient(135deg, var(--color-background-soft), var(--color-background-mute));
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.hero__eyebrow {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-mute);
}

.hero__title {
  margin: 0.35rem 0 0.75rem;
  font-size: clamp(2rem, 5vw, 2.8rem);
  line-height: 1.15;
}

.hero__subtitle {
  color: var(--color-text-soft);
  max-width: 540px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.hero__panel {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  flex-wrap: wrap;
}

.stat-card {
  padding: 0.9rem 1rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  box-shadow: var(--shadow);
  flex: 1 1 150px;
}

.stat-card__label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-mute);
}

.stat-card__value {
  margin-top: 0.35rem;
  font-size: 1.65rem;
  font-weight: 700;
}

.controls-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  padding: 1.5rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
  box-shadow: var(--shadow);
}

.controls-panel__field {
  display: flex;
  align-items: flex-end;
  flex: 0 1 220px;
}

.controls-panel__field--grow {
  flex: 1 1 320px;
  min-width: 260px;
}

.controls-panel__field--align-end {
  justify-content: flex-end;
  flex: 0 0 auto;
  margin-left: auto;
}

.controls-panel__cart {
  min-width: 160px;
}

.form-field--stretch {
  width: 100%;
}

main {
  width: 100%;
}

@media (max-width: 768px) {
  .controls-panel__field--align-end {
    margin-left: 0;
    width: 100%;
  }

  .controls-panel__cart {
    width: 100%;
  }
}
</style>
