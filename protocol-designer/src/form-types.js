// @flow

// TODO Ian 2018-04-05 move all form types into here, instead of separating form fields and processed form data

export type MixArgs = {|
  volume: number,
  times: number
|}

export type SharedFormDataFields = {|
  /** Optional user-readable name for this step */
  name: ?string,
  /** Optional user-readable description/notes for this step */
  description: ?string,
|}

export type ChangeTipOptions = 'always' | 'once' | 'never'
