import clsx from 'clsx'

import { ICON_DATA_BY_NAME } from './icon-data'
import styles from './icon.module.css'

import type { ReactNode, SVGProps } from 'react'

export type IconName = keyof typeof ICON_DATA_BY_NAME

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** name constant of the icon to display */
  name: IconName
  /** spin the icon with a CSS animation */
  spin?: boolean
  /** override default size */
  size?: string | number
  /** x attribute as a number or string (for nesting inside another SVG) */
  x?: number | string
  /** y attribute as a number or string (for nesting inside another SVG) */
  y?: number | string
  /** width as a number or string (for nesting inside another SVG) */
  svgHeight?: number | string
  /** height as a number or string (for nesting inside another SVG) */
  svgWidth?: number | string
  /** inline style passed into the icon svg */
  style?: Record<string, string | number>
  /** optional children */
  children?: ReactNode
  id?: string
  color?: string
  height?: string | number
  width?: string | number
  transform?: string
  transformOrigin?: string | number
  marginTop?: string
  maxWidth?: string
  minWidth?: string
  marginRight?: string
  paddingTop?: string
  minHeight?: string
  marginBottom?: string
  opacity?: number
  marginLeft?: string
  paddingRight?: string
  borderRadius?: string
  margin?: string
  flex?: string
  backgroundColor?: string
  alignSelf?: string
  paddingBottom?: string
}

/**
 * Inline SVG icon component
 *
 * If you need access to the IconName type, you can:
 * ```js
 * import type { IconName } from '@opentrons/components'
 * ```
 */
export function Icon(props: IconProps): JSX.Element | null {
  const {
    name,
    className,
    spin,
    id,
    size,
    height: rawHeight,
    width: rawWidth,
    color,
    transform,
    transformOrigin,
    marginTop,
    maxWidth,
    minWidth,
    marginRight,
    paddingTop,
    minHeight,
    marginBottom,
    opacity,
    marginLeft,
    paddingRight,
    borderRadius,
    margin,
    flex,
    backgroundColor,
    alignSelf,
    paddingBottom,
    ...svgProps
  } = props

  const height = size != null ? size : rawHeight
  const width = size != null ? size : rawWidth
  if (!(name in ICON_DATA_BY_NAME)) {
    console.error(`"${name}" is not a valid Icon name`)
    return null
  }

  const { viewBox, path } = ICON_DATA_BY_NAME[name]

  const style = Object.fromEntries(
    Object.entries({
      color,
      height,
      width,
      transform,
      transformOrigin,
      marginTop,
      maxWidth,
      minWidth,
      marginRight,
      paddingTop,
      minHeight,
      marginBottom,
      opacity,
      marginLeft,
      paddingRight,
      borderRadius,
      margin,
      flex,
      backgroundColor,
      alignSelf,
      paddingBottom,
      //  filter undefined props
    }).filter(([_, value]) => value != null)
  )

  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox={viewBox}
      className={clsx(className, { [styles.spin]: spin })}
      style={{ ...style }}
      {...svgProps}
      id={id}
    >
      <path aria-roledescription={name} fillRule="evenodd" d={path} />
      {props.children}
    </svg>
  )
}
