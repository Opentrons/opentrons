/**
 * Represents the parameters for uploading a CSV file.
 *
 * @interface UploadCsvFileParams
 * @property {File} [file] - An optional File object for Desktop app
 * @property {string} [filePath] - An optional string for USB drive on ODD
 */

export interface UploadCsvFileParams {
  file?: File
  filePath?: string
  isStub?: boolean
}

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
