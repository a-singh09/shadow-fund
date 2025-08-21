// Polyfills for Node.js modules in browser environment
import { Buffer } from "buffer";

// Make Buffer available globally
if (typeof window !== "undefined") {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
}

// Also make it available on globalThis
if (typeof globalThis !== "undefined") {
  (globalThis as any).Buffer = Buffer;
}

export {};
