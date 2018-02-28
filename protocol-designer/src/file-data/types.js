// @flow
export type FilePageFields = {
  name: string,
  author: string,
  description: string,

  // pipettes are empty string '' if user selects 'None'
  leftPipette: string,
  rightPipette: string
}

export type FilePageFieldAccessors = $Keys<FilePageFields>
