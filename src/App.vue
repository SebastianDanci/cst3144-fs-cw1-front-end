<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import HeroSection from './components/HeroSection.vue';
import LessonList from './components/LessonList.vue';
import CartPanel from './components/CartPanel.vue';

const API_BASE = 'http://localhost:3000';

const isDarkMode = ref(false);
const showCart = ref(false);
const lessons = ref([]);
const lessonLookup = ref({});

const updateLessonCache = (lessonId, updates) => {
  const existing = lessonLookup.value[lessonId];
  if (!existing) {
    return;
  }
  const updatedLesson = { ...existing, ...updates };
  lessonLookup.value = { ...lessonLookup.value, [lessonId]: updatedLesson };
  const index = lessons.value.findIndex((lesson) => lesson.id === lessonId);
  if (index !== -1) {
    lessons.value.splice(index, 1, updatedLesson);
  }
};
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
    const fetchedLessons = await response.json();
    lessons.value = fetchedLessons;
    lessonLookup.value = {
      ...lessonLookup.value,
      ...fetchedLessons.reduce((acc, lesson) => {
        acc[lesson.id] = lesson;
        return acc;
      }, {})
    };
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
      const lesson = lessonLookup.value[item.lessonId];
      if (!lesson) {
        return {
          lessonId: item.lessonId,
          subject: `Lesson ${item.lessonId}`,
          location: 'Unavailable',
          price: 0,
          image: '',
          quantity: item.quantity,
          maxAvailable: item.quantity
        };
      }
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
  const lesson = lessonLookup.value[lessonId];
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
  const cartEntry = cart.value.find((item) => item.lessonId === lessonId);
  if (!cartEntry) {
    return;
  }

  const lesson = lessonLookup.value[lessonId];

  if (quantity <= 0) {
    cart.value = cart.value.filter((item) => item.lessonId !== lessonId);
    return;
  }

  if (lesson && quantity > lesson.spaces) {
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
        const lesson = lessonLookup.value[item.lessonId];
        if (!lesson) return;
        const currentSpaces = typeof lesson.spaces === 'number' ? lesson.spaces : 0;
        const updatedSpaces = Math.max(currentSpaces - item.quantity, 0);
        updateLessonCache(item.lessonId, { spaces: updatedSpaces });
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
    <HeroSection
      :is-dark-mode="isDarkMode"
      :available-lessons-count="availableLessonsCount"
      :cart-count="cartCount"
      :cart-total="cartTotal"
      @toggle-theme="toggleTheme"
    />

    <section class="controls-panel">
      <div class="controls-panel__field controls-panel__field--grow">
        <label class="form-field form-field--stretch">
          <span class="form-field__label">Search</span>
          <input
            v-model="searchQuery"
            type="search"
            class="input"
            placeholder="Search by subject, location, or price"
            :disabled="showCart"
          />
        </label>
      </div>

      <div class="controls-panel__field">
        <label class="form-field">
          <span class="form-field__label">Sort Column</span>
          <select v-model="sortField" class="input" :disabled="showCart">
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
          <select v-model="sortOrder" class="input" :disabled="showCart">
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
/* Component-specific in main.css  */
</style>
