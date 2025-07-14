import type { CSSProperties, ReactElement, ReactNode } from 'react'

export interface ForeignObjectProps extends CSSProperties {
  children?: ReactNode
  className?: string
  /** attach a width attribute to the <svg> element */
  svgWidth?: string | number
  /** attach a height attribute to the <svg> element */
  svgHeight?: string | number
  /**
   * internal helper prop to remap width style-prop to CSS
   * @internal
   */
  _cssWidth?: string | number
  /**
   * internal helper prop to remap height style-prop to CSS
   * @internal
   */
  _cssHeight?: string | number
}

/**
 * Foreign Object styled atomic component
 *
 * @component
 */

export const ForeignObject = ({
  className,
  svgWidth,
  svgHeight,
  _cssWidth,
  _cssHeight,
  width, // style-prop width (intercepted)
  height, // style-prop height (intercepted)
  children,
  ...rest
}: ForeignObjectProps): ReactElement => {
  // Internal mapping logic
  const mergedStyle: CSSProperties = {
    width: _cssWidth ?? width,
    height: _cssHeight ?? height,
  }

  return (
    <foreignObject
      width={svgWidth}
      height={svgHeight}
      style={mergedStyle}
      children={children}
      {...rest} // forwards things like x, y, etc.
    />
  )
}
