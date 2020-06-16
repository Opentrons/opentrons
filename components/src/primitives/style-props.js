// @flow
// common styling props you can apply to any primitive component
// props are string type for flexibility, but try to use constants for safety

import pick from 'lodash/pick'

import * as Types from './types'

import type { Styles } from 'styled-components'

const COLOR_PROPS = ['color', 'backgroundColor', 'opacity']

const TYPOGRAPHY_PROPS = [
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'textAlign',
  'textTransform',
]

const SPACING_PROPS = [
  'margin',
  'marginX',
  'marginY',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingX',
  'paddingY',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
]

const BORDER_PROPS = [
  'border',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderRadius',
]

const FLEXBOX_PROPS = [
  'flex',
  'alignItems',
  'justifyContent',
  'flexDirection',
  'flexWrap',
]

const LAYOUT_PROPS = [
  'display',
  'size',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'overflow',
  'overflowX',
  'overflowY',
]

const POSITION_PROPS = ['position', 'zIndex', 'top', 'right', 'bottom', 'left']

const STYLE_PROPS = [
  ...COLOR_PROPS,
  ...TYPOGRAPHY_PROPS,
  ...SPACING_PROPS,
  ...BORDER_PROPS,
  ...FLEXBOX_PROPS,
  ...LAYOUT_PROPS,
  ...POSITION_PROPS,
]

const colorStyles = (props: { ...Types.ColorProps, ... }) => {
  return (pick(props, COLOR_PROPS): Types.ColorProps)
}

const typographyStyles = (props: { ...Types.TypographyProps, ... }) => {
  return (pick(props, TYPOGRAPHY_PROPS): Types.TypographyProps)
}

const spacingStyles = (props: { ...Types.SpacingProps, ... }) => {
  const { marginX, marginY, paddingX, paddingY, ...styles } = (pick(
    props,
    SPACING_PROPS
  ): Types.SpacingProps)

  if (marginX != null) {
    styles.marginRight = styles.marginRight ?? marginX
    styles.marginLeft = styles.marginLeft ?? marginX
  }
  if (marginY != null) {
    styles.marginTop = styles.marginTop ?? marginY
    styles.marginBottom = styles.marginBottom ?? marginY
  }
  if (paddingX != null) {
    styles.paddingRight = styles.paddingRight ?? paddingX
    styles.paddingLeft = styles.paddingLeft ?? paddingX
  }
  if (paddingY != null) {
    styles.paddingTop = styles.paddingTop ?? paddingY
    styles.paddingBottom = styles.paddingBottom ?? paddingY
  }

  return styles
}

const borderStyles = (props: { ...Types.BorderProps, ... }) => {
  return (pick(props, BORDER_PROPS): Types.BorderProps)
}

const flexboxStyles = (props: { ...Types.FlexboxProps, ... }) => {
  return (pick(props, FLEXBOX_PROPS): Types.FlexboxProps)
}

const layoutStyles = (props: { ...Types.LayoutProps, ... }) => {
  const { size, ...styles } = (pick(props, LAYOUT_PROPS): Types.LayoutProps)

  if (size != null) {
    styles.width = styles.width ?? size
    styles.height = styles.height ?? size
  }

  return styles
}

const positionStyles = (props: { ...Types.PositionProps, ... }) => {
  return (pick(props, POSITION_PROPS): Types.PositionProps)
}

export const styleProps = (props: { ...Types.StyleProps, ... }): Styles => ({
  ...colorStyles(props),
  ...typographyStyles(props),
  ...spacingStyles(props),
  ...borderStyles(props),
  ...flexboxStyles(props),
  ...layoutStyles(props),
  ...positionStyles(props),
})

export const isntStyleProp = (prop: string): boolean =>
  !STYLE_PROPS.includes(prop)
