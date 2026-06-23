// Type shims for design-sync owned previews.
// 'client' is a virtual module shimmed to window.<globalName>.* by the ds-sync bundler.
declare module 'client';

// Asset imports return a URL string (esbuild dataurl/file loader)
declare module '*.png' { const src: string; export default src; }
declare module '*.svg' { const src: string; export default src; }
declare module '*.jpg' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
