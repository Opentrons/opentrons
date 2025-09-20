// known style types
import type { ComponentType, CSSProperties } from 'react'

export interface ColorProps {
  color?: string
  backgroundColor?: string
  opacity?: string | number
}

export interface TypographyProps {
  fontSize?: string | number
  fontWeight?: string | number
  fontStyle?: string
  lineHeight?: string | number
  textAlign?: string
  textTransform?: string
  textDecoration?: string
  textOverflow?: string
}

export interface SpacingProps {
  margin?: string | number
  marginX?: string | number
  marginY?: string | number
  marginTop?: string | number
  marginRight?: string | number
  marginBottom?: string | number
  marginLeft?: string | number
  padding?: string | number
  paddingX?: string | number
  paddingY?: string | number
  paddingTop?: string | number
  paddingRight?: string | number
  paddingBottom?: string | number
  paddingLeft?: string | number
}

export interface BorderProps {
  border?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
  borderRadius?: string | number
  borderWidth?: string | number
  borderColor?: string
  boxShadow?: string
}

export interface FlexboxProps {
  flex?: string | number
  alignItems?: string
  alignSelf?: string
  alignContent?: string
  justifyContent?: string
  justifyItems?: string
  justifySelf?: string
  flexDirection?: string
  flexWrap?: string
  whiteSpace?: string
}

export interface GridProps {
  columnGap?: string | number
  gridGap?: string | number
  gap?: string | number
  gridTemplateAreas?: string
  gridTemplateRows?: string
  gridTemplateColumns?: string
  gridArea?: string | number
  gridRow?: string | number
  gridColumn?: string | number
}

export interface LayoutProps {
  display?: string
  visibility?: string
  size?: string | number
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  height?: string | number
  minHeight?: string | number
  maxHeight?: string | number
  overflow?: CSSProperties['overflow']
  overflowX?: CSSProperties['overflowX']
  overflowY?: CSSProperties['overflowY']
  wordSpacing?: string | number
  cursor?: CSSProperties['cursor']
  overflowWrap?: string
}

export interface PositionProps {
  position?: string
  zIndex?: string | number
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
  transform?: string
  filter?: string
  transformOrigin?: CSSProperties['transformOrigin']
}

export interface TransitionProps {
  transition?: string
}

export interface StyleProps
  extends ColorProps,
    TypographyProps,
    SpacingProps,
    BorderProps,
    FlexboxProps,
    GridProps,
    LayoutProps,
    PositionProps,
    TransitionProps {
  className?: string
}

export type PrimitiveComponent<
  Instance extends keyof JSX.IntrinsicElements | ComponentType<any>,
  Props extends StyleProps = StyleProps
> = ComponentType<
  Instance extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[Instance] & Props
    : Instance extends ComponentType<infer P>
    ? P & Props
    : Props
>
