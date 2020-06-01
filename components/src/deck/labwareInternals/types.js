// @flow
export type WellMouseEvent = {|
  wellName: string,
  event: SyntheticMouseEvent<Element>,
|}

// wellName to CSS color, eg {'A1': '#123456'}
export type WellFill = { [wellName: string]: string }

// Use this like a Set!
export type WellGroup = $Shape<{| [wellName: string]: null |}>
