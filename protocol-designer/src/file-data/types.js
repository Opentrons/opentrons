// @flow
export type FileMetadataFields = {
  name: string,
  author: string,
  description: string,
}

export type FileMetadataFieldAccessors = $Keys<FileMetadataFields>
