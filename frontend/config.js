/**
 * YAN Platform — Frontend Configuration
 * Single source of truth for API URLs and environment detection.
 */
const YAN_CONFIG = (() => {
    const API_BASE_URL =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api/v1"
        : "https://youth-action-network-24pe.vercel.app/api/v1";

    return Object.freeze({
        API_BASE_URL
    });
})();
