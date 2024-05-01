export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9-.]/gi, '_')
}
