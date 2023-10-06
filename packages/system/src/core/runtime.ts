/** Determine if the `Symbol` language feature is available */
export const hasSymbol = typeof Symbol !== 'undefined';

/** Determine if the self variable is available */
export const hasSelf = typeof self !== 'undefined';

/** Determine if the document variable is available */
export const hasDocument = typeof document !== 'undefined' && typeof document.createElement === 'function';

/** Determine if the globalThis variable is available */
export const hasGlobalThis = typeof globalThis !== 'undefined';

/** The global object reference */
export const global = hasGlobalThis ? globalThis : self;
