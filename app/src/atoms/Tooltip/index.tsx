import * as React from 'react'
import {
  COLORS,
  TYPOGRAPHY,
  UseTooltipResultTooltipProps,
} from '@opentrons/components'
import { Tooltip as SharedTooltip } from '@opentrons/components/src/tooltips/Tooltip'

export interface TooltipProps {
  key: string
  children: React.ReactNode
  tooltipProps: UseTooltipResultTooltipProps & { visible: boolean }
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const { key, children, tooltipProps } = props

  return (
    <SharedTooltip
      {...tooltipProps}
      backgroundColor={COLORS.darkBlack}
      key={key}
      fontSize={TYPOGRAPHY.fontSizeCaption}
      width={'8.75rem'}
    >
      {children}
    </SharedTooltip>
  )
}
