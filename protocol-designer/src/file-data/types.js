// @flow
export type FilePageFields = {|
  name: string,
  author: string,
  description: string
  // TODO Ian 2018-02-26 add pipettes to form
|}

export type FilePageFieldAccessors = $Keys<FilePageFields>
