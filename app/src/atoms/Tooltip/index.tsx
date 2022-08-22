import * as React from 'react'
import {
  COLORS,
  TYPOGRAPHY,
  Tooltip as SharedTooltip,
} from '@opentrons/components'
import type { UseTooltipResultTooltipProps } from '@opentrons/components'

export interface TooltipProps {
  children: React.ReactNode
  tooltipProps: UseTooltipResultTooltipProps & { visible: boolean }
  key?: string
  width?: string
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const { children, tooltipProps, width } = props

  return (
    <SharedTooltip
      {...tooltipProps}
      backgroundColor={COLORS.darkBlackEnabled}
      fontSize={TYPOGRAPHY.fontSizeCaption}
      width={width != null ? width : '8.75rem'}
    >
      {children}
    </SharedTooltip>
  )
}
