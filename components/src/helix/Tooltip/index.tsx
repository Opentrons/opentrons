import { COLORS } from '../../helix-design-system'
import { FLEX_MAX_CONTENT } from '../../styles'
import { LegacyTooltip } from '../../tooltips'
import { TYPOGRAPHY } from '../../ui-style-constants'

import type { ReactNode } from 'react'
import type { StyleProps } from '../../primitives'
import type { UseTooltipResultTooltipProps } from '../../tooltips'

export interface TooltipProps extends StyleProps {
  children: ReactNode
  tooltipProps: UseTooltipResultTooltipProps & { visible: boolean }
  key?: string
}

export function Tooltip(props: TooltipProps): ReactNode {
  const {
    children,
    tooltipProps,
    width = FLEX_MAX_CONTENT,
    maxWidth = '8.75rem',
    ...styleProps
  } = props

  return (
    <LegacyTooltip
      {...tooltipProps}
      backgroundColor={COLORS.black90}
      fontSize={TYPOGRAPHY.fontSizeCaption}
      width={width}
      maxWidth={maxWidth}
      {...styleProps}
    >
      {children}
    </LegacyTooltip>
  )
}
