import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'game-core': [
            './src/core/GameLoop.ts',
            './src/core/EventManager.ts',
            './src/core/InputManager.ts',
            './src/core/AudioManager.ts'
          ],
          'game-logic': [
            './src/game/managers/WorldManager.ts',
            './src/game/managers/FarmManager.ts',
            './src/game/managers/TimeManager.ts',
            './src/game/managers/InventoryManager.ts',
            './src/game/managers/EconomyManager.ts',
            './src/game/managers/AnimalsManager.ts',
            './src/game/managers/NPCManager.ts',
            './src/game/managers/CraftingManager.ts',
            './src/game/managers/QuestManager.ts',
            './src/game/managers/MonetizationManager.ts',
            './src/game/managers/MultiplayerManager.ts'
          ]
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
