import * as React from 'react'
import { COLORS } from '../../helix-design-system'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { LegacyTooltip } from '../../tooltips'

import type { UseTooltipResultTooltipProps } from '../../tooltips'
import type { StyleProps } from '../../primitives'

export interface TooltipProps extends StyleProps {
  children: React.ReactNode
  tooltipProps: UseTooltipResultTooltipProps & { visible: boolean }
  key?: string
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const { children, tooltipProps, width = '8.75rem', ...styleProps } = props

  return (
    <LegacyTooltip
      {...tooltipProps}
      backgroundColor={COLORS.black90}
      fontSize={TYPOGRAPHY.fontSizeCaption}
      width={width}
      {...styleProps}
    >
      {children}
    </LegacyTooltip>
  )
}
