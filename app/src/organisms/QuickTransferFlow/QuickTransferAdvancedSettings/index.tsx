import * as React from 'react'
import { Flex, SPACING, DIRECTION_COLUMN } from '@opentrons/components'
import { BaseSettings } from './BaseSettings'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface QuickTransferAdvancedSettingsProps {
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function QuickTransferAdvancedSettings(
  props: QuickTransferAdvancedSettingsProps
): JSX.Element | null {
  const { state, dispatch } = props

  return (
    <Flex
      gridGap={SPACING.spacing8}
      flexDirection={DIRECTION_COLUMN}
      marginTop="12rem"
    >
      <BaseSettings state={state} dispatch={dispatch} />
    </Flex>
  )
}
