import type { ValidFileType } from '../types'

export const ALLOWED_FILE_TYPES = {
  pdf: ['.pdf'],
  csv: ['.csv'],
  python: ['.py'],
} as const

// MIME types provide better security than file extensions
// as they check the actual file content headers
export const ALLOWED_MIME_TYPES = {
  pdf: ['application/pdf'] as string[],
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel'] as string[],
  python: [
    'text/x-python',
    'text/plain',
    'application/x-python-code',
  ] as string[],
}

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
  pdf: 5 * UNIT_MB, // 5MB
  csv: 2 * UNIT_MB, // 2MB
  python: 1 * UNIT_MB, // 1MB
} as const

export const MAX_FILES_PER_MESSAGE = 5

export const validateFile = (file: File): FileValidationResult => {
  // First check MIME type for security
  const isSupportedMimeType =
    ALLOWED_MIME_TYPES.pdf.includes(file.type) ||
    ALLOWED_MIME_TYPES.csv.includes(file.type) ||
    ALLOWED_MIME_TYPES.python.includes(file.type)

  // Fall back to extension check if MIME type is empty or not recognized
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const isSupportedExtension =
    ALLOWED_FILE_TYPES.pdf.includes(extension as '.pdf') ||
    ALLOWED_FILE_TYPES.csv.includes(extension as '.csv') ||
    ALLOWED_FILE_TYPES.python.includes(extension as '.py')

  if (!isSupportedMimeType && !isSupportedExtension) {
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
  // Check MIME type first for security
  if (ALLOWED_MIME_TYPES.pdf.includes(file.type)) {
    return 'pdf'
  }
  if (ALLOWED_MIME_TYPES.csv.includes(file.type)) {
    return 'csv'
  }
  if (ALLOWED_MIME_TYPES.python.includes(file.type)) {
    return 'python'
  }

  // Fall back to extension if MIME type is not recognized
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
  throw new Error(`Unsupported file type: ${file.type || extension}`)
}

const fileTypeLabels: Record<FileType, string> = {
  pdf: 'PDF file',
  csv: 'CSV file',
  python: 'Python file',
}

export const getFileTypeLabel = (type: FileType): string => fileTypeLabels[type]

export const readFileContent = async (
  file: File
): Promise<ProcessedFileContent> => {
  const type = getFileType(file)
  switch (type) {
    case 'pdf':
      // PDF files are encoded as base64 for proper document handling
      // Using simplified approach similar to Anthropic SDK example
      const pdfBuffer = await file.arrayBuffer()

      // Check if PDF is too large (base64 encoding increases size by ~33%)
      // Claude has a ~200k token limit, so we need to be conservative
      const MAX_PDF_SIZE_MB = 5 * 1024 * 1024 // 5MB limit for PDFs

      if (pdfBuffer.byteLength > MAX_PDF_SIZE_MB) {
        throw new Error(
          `PDF file is too large (${Math.round(
            pdfBuffer.byteLength / (1024 * 1024)
          )}MB). Please use a PDF smaller than ${Math.round(
            MAX_PDF_SIZE_MB / (1024 * 1024)
          )}MB or extract the relevant text content and paste it directly.`
        )
      }

      // Convert to base64 using browser equivalent of fs.readFileSync().toString('base64')
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Extract base64 data (remove data:application/pdf;base64, prefix)
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = () => {
          reject(new Error('Failed to read PDF file'))
        }
        reader.readAsDataURL(file)
      })

      // Validate base64 encoding
      if (!pdfBase64 || pdfBase64.length === 0) {
        throw new Error('Failed to encode PDF as base64')
      }

      // Additional check for base64 size (approximate token count)
      if (pdfBase64.length > 150000) {
        // Very conservative estimate
        throw new Error(
          `PDF file creates too large a request (${Math.round(
            pdfBase64.length / 1000
          )}k characters). Please use a smaller PDF or extract the relevant text content.`
        )
      }

      return {
        content: pdfBase64,
        mediaType: 'application/pdf',
      }

    case 'csv':
      // CSV files - decide whether to parse as JSON or keep as text
      const csvText = await file.text()

      // If CSV is large, send as raw text to avoid timeout
      const MAX_CSV_JSON_SIZE_KB = 500 * 1024 // 500KB limit for JSON conversion

      try {
        // Simple CSV to JSON conversion
        const lines = csvText.split('\n').filter(line => line.trim())
        if (lines.length === 0)
          return { content: '[]', mediaType: 'application/json' }

        // Check if CSV is too large to convert to JSON
        if (csvText.length > MAX_CSV_JSON_SIZE_KB) {
          return {
            content: csvText,
            mediaType: 'text/csv',
          }
        }

        const headers = lines[0].split(',').map(h => h.trim())
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })

        // Use compact JSON formatting to save space
        const jsonContent = JSON.stringify(data)

        // If resulting JSON is too large, fall back to CSV
        if (jsonContent.length > MAX_CSV_JSON_SIZE_KB * 2) {
          return {
            content: csvText,
            mediaType: 'text/csv',
          }
        }

        return {
          content: jsonContent,
          mediaType: 'application/json',
        }
      } catch (error) {
        console.error('CSV parsing error:', error)
        // Fallback to raw text if CSV parsing fails
        return {
          content: csvText,
          mediaType: 'text/csv',
        }
      }

    case 'python':
      // Python files as plain text
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
