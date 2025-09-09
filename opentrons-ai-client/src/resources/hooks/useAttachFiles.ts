import { useState } from 'react'

import {
  MAX_FILES_PER_MESSAGE,
  prepareFilesForMultipart,
  validateFile,
} from '../utils/fileUtils'

interface UseAttachFilesReturn {
  attachedFiles: File[]
  fileError: string | null
  handleFileSelect: (files: FileList) => void
  handleRemoveFile: (index: number) => void
  prepareFilesForUpload: () => File[] | null
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

  const prepareFilesForUpload = (): File[] | null => {
    const result = prepareFilesForMultipart(attachedFiles)
    if (result === null) {
      setFileError('Failed to validate files')
    }
    return result
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
    clearFiles,
    clearError,
  }
}
