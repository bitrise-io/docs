window.__resetPage = window.__resetPage || [];

/*÷
 * Resets the page by calling all registered reset functions.
 * This is useful for cleaning up dynamically added elements or state during HMR disposal.
 */
export const reset = () => {
  // Reset the page by removing all dynamically added elements
  window.__resetPage.forEach((reset) => reset && reset());
  window.__resetPage = []; // Clear the reset array after resetting
};

/**
 * Adds a new reset function to the reset array.
 * 
 * @param {Function} callback - The function to be called when the page is reset. 
 */
export const onReset = (callback) => {
  // Add a new reset function to the array
  window.__resetPage.push(callback);
};
