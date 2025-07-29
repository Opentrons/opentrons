// MIME types provide better security than file extensions
// as they check the actual file content headers
export const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf', 'pdf'],
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'csv'],
  python: [
    'text/x-python',
    'text/x-python-script',
    'text/plain',
    'application/x-python-code',
    'python',
  ],
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

  return null
}

/**
 * Prepare files for multipart upload (no processing needed)
 * This is the new, efficient way to handle file uploads
 */
export const prepareFilesForMultipart = (files: File[]): File[] | null => {
  // Validate files but don't process content
  for (const file of files) {
    const type = getFileType(file)
    if (type === null) {
      return null // Unsupported file type
    }

    const validation = validateFile(file)
    if (!validation.isValid) {
      return null // File validation failed
    }
  }

  return files
}

/**
 * Get file extension for display in the icon container based on validated file type
 * This ensures consistency - if a file is validated as Python based on MIME type,
 * it will show .py regardless of actual filename extension
 */
export const getFileExtension = (file: File): string => {
  const fileType = getFileType(file)

  switch (fileType) {
    case 'pdf':
      return '.pdf'
    case 'csv':
      return '.csv'
    case 'python':
      return '.py'
    default:
      return '.file'
  }
}
