import { type ValidFileType } from '../types'

export const ALLOWED_FILE_TYPES = {
  pdf: ['.pdf'],
  csv: ['.csv'],
  python: ['.py'],
} as const

export type FileType = ValidFileType

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface ProcessedFileContent {
  content: string
  mediaType: string
}

const UNIT_MB = 1024 * 1024

export const FILE_SIZE_LIMITS = {
  pdf: 10 * UNIT_MB, // 10MB
  csv: 2 * UNIT_MB, // 2MB
  python: 1 * UNIT_MB, // 1MB
} as const

export const MAX_FILES_PER_MESSAGE = 5

export const validateFile = (file: File): FileValidationResult => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  // Check if file type is supported
  const isSupportedType =
    ALLOWED_FILE_TYPES.pdf.includes(extension as '.pdf') ||
    ALLOWED_FILE_TYPES.csv.includes(extension as '.csv') ||
    ALLOWED_FILE_TYPES.python.includes(extension as '.py')

  if (!isSupportedType) {
    return {
      isValid: false,
      error:
        'Unsupported file type. Please upload PDF, CSV, or Python (.py) files.',
    }
  }

  const fileType = getFileType(file)
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

export const getFileType = (file: File): FileType => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (ALLOWED_FILE_TYPES.pdf.includes(extension as '.pdf')) {
    return 'pdf'
  }
  if (ALLOWED_FILE_TYPES.csv.includes(extension as '.csv')) {
    return 'csv'
  }
  if (ALLOWED_FILE_TYPES.python.includes(extension as '.py')) {
    return 'python'
  }

  // This should never happen if validateFile is called first
  throw new Error(`Unsupported file type: ${extension}`)
}

const fileTypeLabels: Record<FileType, string> = {
  pdf: 'PDF file',
  csv: 'CSV file',
  python: 'Python file',
}

export const getFileTypeLabel = (type: FileType): string => fileTypeLabels[type]

export const readFileContent = async (
  file: File,
  type: FileType
): Promise<ProcessedFileContent> => {
  switch (type) {
    case 'pdf':
      // PDF files need base64 encoding for Anthropic API
      const pdfArrayBuffer = await file.arrayBuffer()
      const pdfBase64 = btoa(
        String.fromCharCode(...new Uint8Array(pdfArrayBuffer))
      )
      return {
        content: pdfBase64,
        mediaType: 'application/pdf',
      }

    case 'csv':
      // CSV files are sent as plain text
      const csvText = await file.text()
      return {
        content: csvText,
        mediaType: 'text/csv',
      }

    case 'python':
      // Python files are sent as plain text
      const pyText = await file.text()
      return {
        content: pyText,
        mediaType: 'text/x-python',
      }

    default:
      throw new Error(`Unsupported file type: ${type}`)
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const size = bytes / Math.pow(k, i)
  const rounded = size.toFixed(1)

  return `${rounded} ${sizes[i]}`
}
