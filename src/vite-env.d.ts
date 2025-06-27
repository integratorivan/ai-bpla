/// <reference types="vite/client" />

// Объявление типов для ml5.js
declare global {
  interface Window {
    ml5: any;
  }
  const ml5: any;
}
