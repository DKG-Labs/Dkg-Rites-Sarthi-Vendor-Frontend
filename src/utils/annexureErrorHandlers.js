/**
 * Annexure Error Handlers - Refines technical error messages into user-friendly content.
 * Follows enterprise UX standards: empathetic, action-oriented, and simple.
 */

/**
 * Translates a technical error into a refined, human-readable message.
 * @param {Error} error - The caught error object
 * @returns {string} A polished UX message
 */
export const getAnnexureErrorMessage = (error) => {
  // 1. Instant Connection Check
  if (!window.navigator.onLine) {
    return "It looks like you're offline. Please check your internet connection.";
  }

  const message = error.message || "";
  
  // 2. High-integrity Status Parsing (Handles "HTTP 404: Not Found" Safely)
  const httpStatusMatch = message.match(/HTTP (\d{3})/);
  const status = httpStatusMatch ? parseInt(httpStatusMatch[1]) : (error.status || error.response?.status);

  // 3. UX-Polished Mapping
  switch (status) {
    case 401:
      return "Your session has expired. Please log in again.";

    case 403:
      return "You don’t have access to view this report.";

    case 404:
      return "We couldn’t find the requested report.";

    case 400:
      return "Something seems incorrect. Please check and try again.";

    case 500:
    case 502:
    case 503:
      return "We’re unable to load the report right now. Please try again later.";

    default:
      // Handle generic fetch timeouts or unknown failures
      if (message.includes("Failed to fetch") || message.includes("timeout")) {
        return "The request is taking longer than expected. Please try again.";
      }
      return "Something went wrong. Please try again.";
  }
};
