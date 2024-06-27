import * as React from 'react'
import { Flex, SPACING, DIRECTION_COLUMN } from '@opentrons/components'
import { BaseSettings } from './BaseSettings'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface AdvancedSettingsProps {
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function AdvancedSettings(
  props: AdvancedSettingsProps
): JSX.Element | null {
  const { state, dispatch } = props

  return (
    <Flex
      gridGap={SPACING.spacing8}
      flexDirection={DIRECTION_COLUMN}
      marginTop="192px"
    >
      <BaseSettings state={state} dispatch={dispatch} />
    </Flex>
  )
}
