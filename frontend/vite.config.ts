// ------------------------------------------------------------
// Vite Configuration File
//
// This file tells Vite how to build and run our React app.
// ------------------------------------------------------------

// Import Vite helper
import { defineConfig } from "vite";

// Import React plugin
import react from "@vitejs/plugin-react";

// Import Tailwind CSS plugin
import tailwindcss from "@tailwindcss/vite";

// Import Node's path module
// We use this to create the "@" alias.
import path from "path";

// Export the Vite configuration
export default defineConfig({

  // ----------------------------------------------------------
  // Plugins
  // ----------------------------------------------------------
  plugins: [

    // Enable React support
    react(),

    // Enable Tailwind CSS v4
    tailwindcss(),

  ],

  // ----------------------------------------------------------
  // Import aliases
  //
  // Instead of writing:
  //
  // ../../../components/Button
  //
  // we can simply write:
  //
  // @/components/Button
  // ----------------------------------------------------------
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

});