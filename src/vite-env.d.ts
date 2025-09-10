/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENCRYPTION_KEY: string;
  readonly VITE_DEBUG: string;
  readonly VITE_SYS_ABBR: string;
  readonly VITE_SYS_NAME: string;
  readonly VITE_COMPANY_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
