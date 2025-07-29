// MIME types provide better security than file extensions
// as they check the actual file content headers
export const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf'] as string[],
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel'] as string[],
  python: [
    'text/x-python',
    'text/x-python-script',
    'text/plain',
    'application/x-python-code',
  ] as string[],
}

export type FileType = 'pdf' | 'csv' | 'python'

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

const UNIT_KB = 1024
const UNIT_MB = UNIT_KB * UNIT_KB

export const FILE_SIZE_LIMITS = {
  pdf: 5 * UNIT_MB, // 5MB
  csv: 2 * UNIT_MB, // 2MB
  python: 1 * UNIT_MB, // 1MB
} as const

export const MAX_FILES_PER_MESSAGE = 5

export const validateFile = (file: File): FileValidationResult => {
  const fileType = getFileType(file)

  if (!fileType) {
    return {
      isValid: false,
      error:
        'Unsupported file type. Please upload PDF, CSV, or Python (.py) files.',
    }
  }
  const sizeLimit = FILE_SIZE_LIMITS[fileType]
  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / UNIT_MB)
    return {
      isValid: false,
      error: `File size too large. ${fileType.toUpperCase()} files must be under ${sizeMB}MB.`,
    }
  }

  return { isValid: true }
}

export const getFileType = (file: File): FileType | null => {
  const mimeType = file.type.toLowerCase()

  // Check MIME type first for security (reliable for PDF/CSV)
  if (ALLOWED_MIME_TYPES.pdf.includes(mimeType)) {
    return 'pdf'
  }
  if (ALLOWED_MIME_TYPES.csv.includes(mimeType)) {
    return 'csv'
  }
  if (ALLOWED_MIME_TYPES.python.includes(mimeType)) {
    return 'python'
  }

  // Special case: Python files often have unreliable MIME types
  // Check if it's a .py file regardless of MIME type
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (extension === '.py') {
    return 'python'
  }

  return null
}

/**
 * Prepare files for multipart upload (no processing needed)
 * This is the new, efficient way to handle file uploads
 */
export const prepareFilesForMultipart = (files: File[]): File[] => {
  // Validate files but don't process content
  return files.filter(file => {
    const type = getFileType(file)
    if (!type) {
      throw new Error(`Unsupported file type: ${file.type || file.name}`)
    }

    const validation = validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return true
  })
}

/**
 * Get simple file type labels for display
 */
export const getSimpleFileTypeLabel = (
  type: string,
  fileName: string
): string => {
  // Check for Python files first
  if (fileName.toLowerCase().endsWith('.py')) {
    return 'Python file'
  }

  switch (type) {
    case 'pdf':
      return 'PDF file'
    case 'csv':
      return 'CSV file'
    case 'python':
      return 'Python file'
  }

  return `${type.toUpperCase()} file`
}

/**
 * Get file extension for display in the icon container
 * e.g., example.py, something.pdf, first.csv
 */
export const getFileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension != null && extension !== '' ? `.${extension}` : '.file'
}
