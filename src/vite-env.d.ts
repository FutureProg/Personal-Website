/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_WRITEUPS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
