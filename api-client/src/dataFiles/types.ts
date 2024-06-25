/**
 * Represents the parameters for uploading a CSV file.
 *
 * @interface UploadCsvFileParams
 * @property {File | string} [fileData] - File object for Desktop app and string for USB drive on ODD
 */

export type FileData = File | string

interface CsvFileData {
  id: string
  createdAt: string
  name: string
}

export interface UploadedCsvFileResponse {
  data: CsvFileData
}

export interface UploadedCsvFilesResponse {
  data: {
    files: CsvFileData[]
  }
}
