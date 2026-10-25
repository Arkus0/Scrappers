/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** wss://…/ws del servidor del modo online (se fija al compilar, p. ej. en Vercel) */
  readonly VITE_SERVIDOR?: string;
}
