import { forwardRef } from 'react'

import { withStyleProps } from '../hocs/withStyleProps'

import type { ComponentProps, FC, ForwardedRef } from 'react'
import type { StyleProps } from './types'

export interface SvgProps extends StyleProps {
  /** attach a width attribute to the <svg> element */
  svgWidth?: string | number
  /** attach a height attribute to the <svg> element */
  svgHeight?: string | number
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

/**
 * SVG primitive component that supports style props
 *
 * @component
 */
const SvgComponent = forwardRef<
  SVGSVGElement,
  SvgProps & ComponentProps<'svg'>
>(
  (
    { svgWidth, svgHeight, className, children, ...props },
    ref: ForwardedRef<SVGSVGElement>
  ) => {
    return (
      <svg
        ref={ref}
        xmlns={SVG_NAMESPACE}
        width={svgWidth}
        height={svgHeight}
        className={className ?? ''}
        {...props}
      >
        {children}
      </svg>
    )
  }
)

SvgComponent.displayName = 'Svg'

/**
 * SVG primitive with style props support
 *
 * @component
 */
export const Svg: FC<ComponentProps<'svg'> & SvgProps> = withStyleProps(
  SvgComponent
) as FC<ComponentProps<'svg'> & SvgProps>
