/**
 * Represents the parameters for uploading a CSV file.
 *
 * @interface UploadCsvFileParams
 * @property {File | string} [fileData] - File object for Desktop app and string for USB drive on ODD
 */

export type FileData = File | string

export interface CsvFileData {
  id: string
  createdAt: string
  name: string
}

export interface ImageFileData {
  id: string
  createdAt: string
  cameraId: string
  commandId?: string
  prevCommandId?: string
}

export interface DataFileDataResponse {
  data: CsvFileData
}

export type UploadedCsvFileResponse = DataFileDataResponse

export interface UploadedCsvFilesResponse {
  data: CsvFileData[]
}

export type DownloadedDataFileResponse = MediaSource

export interface ImageFilesDataResponse {
  data: ImageFileData[]
}
