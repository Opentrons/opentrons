import * as React from 'react'
import {
  COLORS,
  TYPOGRAPHY,
  UseTooltipResultTooltipProps,
} from '@opentrons/components'
import { Tooltip } from '@opentrons/components/src/tooltips/Tooltip'

export interface TooltipProps {
  key: string
  children: React.ReactNode
  tooltipProps: UseTooltipResultTooltipProps
}

export function AppTooltip(props: TooltipProps): JSX.Element {
  const { key, children, tooltipProps } = props

  return (
    <Tooltip
      {...tooltipProps}
      visible={true}
      backgroundColor={COLORS.darkBlack}
      key={key}
      fontSize={TYPOGRAPHY.fontSizeCaption}
      width={'8.75rem'}
    >
      {children}
    </Tooltip>
  )
}
