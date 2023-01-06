import * as React from 'react'
import {
  COLORS,
  TYPOGRAPHY,
  Tooltip as SharedTooltip,
} from '@opentrons/components'
import type {
  UseTooltipResultTooltipProps,
  StyleProps,
} from '@opentrons/components'

export interface TooltipProps extends StyleProps {
  children: React.ReactNode
  tooltipProps: UseTooltipResultTooltipProps & { visible: boolean }
  key?: string
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const { children, tooltipProps, width = '8.75rem', ...styleProps } = props

  return (
    <SharedTooltip
      {...tooltipProps}
      backgroundColor={COLORS.darkBlackEnabled}
      fontSize={TYPOGRAPHY.fontSizeCaption}
      width={width}
      {...styleProps}
    >
      {children}
    </SharedTooltip>
  )
}
