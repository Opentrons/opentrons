// @flow
import * as React from 'react'
import { css, keyframes } from 'styled-components'
import cx from 'classnames'

import { Svg } from '../primitives'
import { ICON_DATA_BY_NAME } from './icon-data'

import type { StyleProps } from '../primitives'

export type IconName = $Keys<typeof ICON_DATA_BY_NAME>

export type IconProps = {|
  /** name constant of the icon to display */
  name: IconName,
  /** classes to apply */
  className?: string,
  /** spin the icon with a CSS animation */
  spin?: boolean,
  /** x attribute as a number or string (for nesting inside another SVG) */
  x?: number | string,
  /** y attribute as a number or string (for nesting inside another SVG) */
  y?: number | string,
  /** width as a number or string (for nesting inside another SVG) */
  svgHeight?: number | string,
  /** height as a number or string (for nesting inside another SVG) */
  svgWidth?: number | string,
  /** inline style passed into the icon svg */
  style?: { [string]: string | number, ... },
  /** optional children */
  children?: React.Node,
  /** primitive styling props */
  ...StyleProps,
|}

const spinAnimation = keyframes`
  100% {
    transform: rotate(360deg);
  }
`

const spinStyle = css`
  &.spin {
    animation: ${spinAnimation} 0.8s steps(8) infinite;
    transform-origin: center;
  }
`

/**
 * Inline SVG icon component
 *
 * If you need access to the IconName type, you can:
 * ```js
 * import type { IconName } from '@opentrons/components'
 * ```
 */
export function Icon(props: IconProps): React.Node {
  const { name, children, className, spin, ...svgProps } = props

  if (!(name in ICON_DATA_BY_NAME)) {
    console.error(`"${name}" is not a valid Icon name`)
    return null
  }

  const { viewBox, path } = ICON_DATA_BY_NAME[name]

  return (
    <Svg
      aria-hidden="true"
      fill="currentColor"
      viewBox={viewBox}
      className={cx(className, { spin })}
      css={spinStyle}
      {...svgProps}
    >
      <path fillRule="evenodd" d={path} />
      {props.children}
    </Svg>
  )
}
