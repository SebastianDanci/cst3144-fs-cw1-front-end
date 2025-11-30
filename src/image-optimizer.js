const PLACEHOLDER = 'https://www.redbubble.com/frontend-static/error/artwork.jpg';

// Resizes remote images via images.weserv.nl while leaving local paths untouched.
export const optimizeImage = (url) => {
  if (!url || typeof url !== 'string') {
    return PLACEHOLDER;
  }

  // Avoid rewriting already optimized or local paths
  if (url.includes('images.weserv.nl') || url.includes('/lesson-images')) {
    return url;
  }

  try {
    const encoded = encodeURIComponent(url);
    return `https://images.weserv.nl/?url=${encoded}&w=480&q=80`;
  } catch (error) {
    return PLACEHOLDER;
  }
};
