import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import {
  getFileType,
  MAX_FILES_PER_MESSAGE,
  prepareFilesForMultipart,
  validateFile,
} from '../utils/fileUtils'

export interface FileAttachmentForBackend {
  id: string
  filename: string
  file_type: string
  content: string
  media_type: string
}

interface UseAttachFilesReturn {
  attachedFiles: File[]
  fileError: string | null
  handleFileSelect: (files: FileList) => void
  handleRemoveFile: (index: number) => void
  prepareFilesForUpload: () => File[]
  processFilesForHistory: (validatedFiles: File[]) => FileAttachmentForBackend[]
  clearFiles: () => void
  clearError: () => void
}

/**
 * Custom hook for managing file attachments in the chat interface
 */
export function useAttachFiles(): UseAttachFilesReturn {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const handleFileSelect = (files: FileList): void => {
    setFileError(null)
    const fileArray = Array.from(files)

    // Check total file count
    if (attachedFiles.length + fileArray.length > MAX_FILES_PER_MESSAGE) {
      setFileError(
        `You can attach a maximum of ${MAX_FILES_PER_MESSAGE} files per message.`
      )
      return
    }

    // Validate each file
    const validFiles: File[] = []
    for (const file of fileArray) {
      const validation = validateFile(file)
      if (!validation.isValid) {
        setFileError(validation.error || 'Invalid file')
        return
      }
      validFiles.push(file)
    }

    setAttachedFiles(prev => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index: number): void => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    setFileError(null)
  }

  const prepareFilesForUpload = (): File[] => {
    try {
      return prepareFilesForMultipart(attachedFiles)
    } catch (error) {
      console.error('File validation failed:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to validate files'
      setFileError(errorMessage)
      throw error
    }
  }

  const processFilesForHistory = (
    validatedFiles: File[]
  ): FileAttachmentForBackend[] => {
    const fileAttachmentsWithContent: FileAttachmentForBackend[] = []

    for (const file of validatedFiles) {
      try {
        const fileType = getFileType(file)
        if (!fileType) {
          throw new Error(`Unsupported file type: ${file.name}`)
        }

        fileAttachmentsWithContent.push({
          id: uuidv4(),
          filename: file.name,
          file_type: fileType,
          content: '', // No content needed for chat history - server processes files via multipart
          media_type: file.type || 'text/plain',
        })
      } catch (error) {
        console.error('Failed to process file for history:', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error,
        })
      }
    }

    return fileAttachmentsWithContent
  }

  const clearFiles = (): void => {
    setAttachedFiles([])
    setFileError(null)
  }

  const clearError = (): void => {
    setFileError(null)
  }

  return {
    attachedFiles,
    fileError,
    handleFileSelect,
    handleRemoveFile,
    prepareFilesForUpload,
    processFilesForHistory,
    clearFiles,
    clearError,
  }
}
