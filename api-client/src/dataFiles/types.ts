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

export interface CsvFileDataResponse {
  data: CsvFileData
}

export type UploadedCsvFileResponse = CsvFileDataResponse

export interface UploadedCsvFilesResponse {
  data: CsvFileData[]
}

export type DownloadedCsvFileResponse = string
