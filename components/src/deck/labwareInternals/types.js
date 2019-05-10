// @flow
export type WellMouseEvent = {|
  wellName: string,
  event: SyntheticMouseEvent<*>,
|}

// wellName to CSS color, eg {'A1': '#123456'}
export type WellFill = { [wellName: string]: string }

// an array of well names. No concept of primary vs non-primary. Order should not matter. Should be unique.
export type WellArray = Array<string>
