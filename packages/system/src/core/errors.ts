export class SystemError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message + ` (${code})`);
  }
}

export function errorMessageWithContext(message: string, context: { id: SystemJS.ModuleId, parentId?: SystemJS.ModuleId }) {
  return `${message} "${context.id}"${context.parentId ? ` parent: "${context.parentId}"` : ''}`;
}
