// @flow
// common styling props you can apply to any styled-component
// props are string type for flexibility, but try to use constants for safety

export type ColorProps = {|
  color?: string,
  backgroundColor?: string,
|}

export type TypographyProps = {|
  fontSize?: string | number,
  fontWeight?: string | number,
  fontStyle?: string,
  lineHeight?: string | number,
  textAlign?: string,
  textTransform?: string,
|}

export type SpacingProps = {|
  margin?: string | number,
  marginX?: string | number,
  marginY?: string | number,
  marginTop?: string | number,
  marginRight?: string | number,
  marginBottom?: string | number,
  marginLeft?: string | number,
  padding?: string | number,
  paddingX?: string | number,
  paddingY?: string | number,
  paddingTop?: string | number,
  paddingRight?: string | number,
  paddingBottom?: string | number,
  paddingLeft?: string | number,
|}

type ColorPropsBase = { ...ColorProps, ... }

type TypographyPropsBase = { ...TypographyProps, ... }

type SpacingPropsBase = { ...SpacingProps, ... }

export const colorStyles = ({ color, backgroundColor }: ColorPropsBase) => `
  ${color != null ? `color: ${color};` : ''}
  ${backgroundColor != null ? `background-color: ${backgroundColor};` : ''}
`

export const typographyStyles = ({
  fontSize,
  fontWeight,
  fontStyle,
  lineHeight,
  textAlign,
  textTransform,
}: TypographyPropsBase) => `
  ${fontSize != null ? `font-size: ${fontSize};` : ''}
  ${fontWeight != null ? `font-weight: ${fontWeight};` : ''}
  ${fontStyle != null ? `font-style: ${fontStyle};` : ''}
  ${lineHeight != null ? `line-height: ${lineHeight};` : ''}
  ${textAlign != null ? `text-align: ${textAlign};` : ''}
  ${textTransform != null ? `text-transform: ${textTransform};` : ''}
`

export const spacingStyles = ({
  margin,
  marginX: mx,
  marginY: my,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  padding,
  paddingX: px,
  paddingY: py,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
}: SpacingPropsBase) => `
  ${margin != null ? `margin: ${margin};` : ''}
  ${mx != null ? `margin-right: ${mx}; margin-left: ${mx};` : ''}
  ${my != null ? `margin-top: ${my}; margin-bottom: ${my};` : ''}
  ${marginTop != null ? `margin-top: ${marginTop};` : ''}
  ${marginRight != null ? `margin-right: ${marginRight};` : ''}
  ${marginBottom != null ? `margin-bottom: ${marginBottom};` : ''}
  ${marginLeft != null ? `margin-left: ${marginLeft};` : ''}
  ${padding != null ? `padding: ${padding};` : ''}
  ${px != null ? `padding-right: ${px}; padding-left: ${px};` : ''}
  ${py != null ? `padding-top: ${py}; padding-bottom: ${py};` : ''}
  ${paddingTop != null ? `padding-top: ${paddingTop};` : ''}
  ${paddingRight != null ? `padding-right: ${paddingRight};` : ''}
  ${paddingBottom != null ? `padding-bottom: ${paddingBottom};` : ''}
  ${paddingLeft != null ? `padding-left: ${paddingLeft};` : ''}
`
