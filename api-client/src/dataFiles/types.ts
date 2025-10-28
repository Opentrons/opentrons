/**
 * Represents the parameters for uploading a CSV file.
 *
 * @interface UploadCsvFileParams
 * @property {File | string} [fileData] - File object for Desktop app and string for USB drive on ODD
 */

export type FileData = File | string

export type MimeType = 'text/csv' | 'image/jpeg'

export interface CsvFileData {
  id: string
  createdAt: string
  name: string
}

export interface DataFileDataResponse {
  data: CsvFileData
}

export type UploadedCsvFileResponse = DataFileDataResponse

export interface UploadedCsvFilesResponse {
  data: CsvFileData[]
}

export interface RunDataFileMetadata {
  id: string
  stored: boolean
  generated: boolean
  mimeType: MimeType
}

export interface RunDataFileMetadataResponse {
  data: RunDataFileMetadata[]
  meta: { cursor: number; totalLength: number }
}

export type DownloadedDataFileResponse = string
export type DownloadedImageFileResponse = Blob
