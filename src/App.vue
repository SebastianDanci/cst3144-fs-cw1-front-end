<script setup>

// Imports

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import HeroSection from './components/HeroSection.vue';
import LessonList from './components/LessonList.vue';
import CartPanel from './components/CartPanel.vue';


// API Configuration

const API_BASE = 'https://cst3144-fs-cw1-back-end.onrender.com';


// Reactive State

const isDarkMode = ref(false);
const showCart = ref(false);
const lessons = ref([]);
const lessonLookup = ref({});

// Normalizes lesson ID to string format (handles MongoDB ObjectId, numbers, etc.)
const normalizeLessonId = (rawId) => {
  if (rawId == null) {
    return undefined;
  }

  if (typeof rawId === 'string') {
    return rawId;
  }

  if (typeof rawId === 'number') {
    return String(rawId);
  }

  if (typeof rawId === 'object') {
    if (typeof rawId.$oid === 'string') {
      return rawId.$oid;
    }
    if (typeof rawId.toHexString === 'function') {
      return rawId.toHexString();
    }
    if (typeof rawId.toString === 'function') {
      const printed = rawId.toString();
      return printed === '[object Object]' ? undefined : printed;
    }
  }

  return String(rawId);
};

// Normalizes lesson object with consistent ID format
const normalizeLesson = (lesson, index, existingCache) => {
  const normalizedId = normalizeLessonId(lesson._id ?? lesson.id ?? lesson.lessonId);
  if (!normalizedId) {
    return null;
  }

  const cached = existingCache[normalizedId];
  const numericId = typeof lesson.id === 'number' ? lesson.id : cached?.numericId ?? null;
  const displayId = cached?.displayId ?? numericId ?? index + 1;

  return {
    ...lesson,
    id: normalizedId,
    numericId,
    displayId
  };
};

// Updates lesson in cache and reactive array
const updateLessonCache = (lessonId, updates) => {
  const existing = lessonLookup.value[lessonId];
  if (!existing) {
    return;
  }
  const updatedLesson = { ...existing, ...updates, id: existing.id, displayId: existing.displayId, numericId: existing.numericId };
  lessonLookup.value = { ...lessonLookup.value, [lessonId]: updatedLesson };
  const index = lessons.value.findIndex((lesson) => lesson.id === lessonId);
  if (index !== -1) {
    lessons.value.splice(index, 1, updatedLesson);
  }
};
// Cart state
const cart = ref([]);

// Search and sort state
const searchQuery = ref('');
const sortField = ref('subject');
const sortOrder = ref('asc');

// Loading and error state
const isLoadingLessons = ref(false);
const lessonError = ref('');
const checkoutMessage = ref('');
const checkoutMessageType = ref('');
const isSubmitting = ref(false);


// Theme Toggle

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
};


// API Functions

// Fetches lessons from API (with optional search query)
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
    const existingCache = { ...lessonLookup.value };
    delete existingCache.undefined;
    const normalizedLessons = fetchedLessons
      .map((lesson, index) => normalizeLesson(lesson, index, existingCache))
      .filter(Boolean);

    lessons.value = normalizedLessons;
    lessonLookup.value = {
      ...existingCache,
      ...normalizedLessons.reduce((acc, lesson) => {
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


// Computed Properties

// Lessons with cart reservation info
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

// Sorted lessons based on selected field and order
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

// Total items in cart
const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));

// Cart button disabled state
const cartButtonDisabled = computed(() => cartCount.value === 0 && !showCart.value);

// Count of lessons with available spaces
const availableLessonsCount = computed(() =>
  decoratedLessons.value.filter((lesson) => lesson.spaces > 0).length
);

// Cart items with full lesson details
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

// Total price of all cart items
const cartTotal = computed(() =>
  cartItemsDetailed.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
);


// Cart Functions

// Adds a lesson to the cart
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

// Updates quantity of a cart item
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

// Removes an item from the cart
const removeCartItem = (lessonId) => {
  cart.value = cart.value.filter((item) => item.lessonId !== lessonId);
};

// Decrements lesson quantity from the lesson list view
const decrementLessonFromList = (lessonId) => {
  const cartEntry = cart.value.find((item) => item.lessonId === lessonId);
  if (!cartEntry) {
    return;
  }
  updateCartQuantity({ lessonId, quantity: cartEntry.quantity - 1 });
};


// View Toggle Functions

// Toggles between lesson list and cart view
const toggleCartView = () => {
  if (cartButtonDisabled.value) {
    return;
  }
  showCart.value = !showCart.value;
};

// Closes cart view and returns to lesson list
const closeCartView = () => {
  showCart.value = false;
};


// Watchers

// Debounced search - waits 300ms after typing stops
let searchTimeoutId;
watch(searchQuery, (newQuery) => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId);
  }
  searchTimeoutId = setTimeout(() => fetchLessons(newQuery.trim()), 300);
});

// Cleanup timeout on component unmount
onUnmounted(() => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId);
  }
});


// Checkout Handler

// Submits order to API and updates lesson spaces
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


// Lifecycle Hooks

// Initialize app - fetch lessons and detect system theme
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
    <HeroSection :is-dark-mode="isDarkMode" :available-lessons-count="availableLessonsCount" :cart-count="cartCount"
      :cart-total="cartTotal" @toggle-theme="toggleTheme" />

    <section class="controls-panel">
      <div class="controls-panel__field controls-panel__field--grow">
        <label class="form-field form-field--stretch">
          <span class="form-field__label">Search</span>
          <input v-model="searchQuery" type="search" class="input" placeholder="Search by subject, location, or price"
            :disabled="showCart" />
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
      <LessonList v-if="!showCart" :lessons="sortedLessons" :is-loading="isLoadingLessons" :error-message="lessonError"
        @add-to-cart="addToCart" @decrement-lesson="decrementLessonFromList" />

      <CartPanel v-else :cart-items="cartItemsDetailed" :total="cartTotal" :checkout-message="checkoutMessage"
        :checkout-message-type="checkoutMessageType" :is-submitting="isSubmitting" @update-quantity="updateCartQuantity"
        @remove-item="removeCartItem" @checkout="handleCheckout" @close-cart="closeCartView" />
    </main>
  </div>
</template>

<style scoped></style>
