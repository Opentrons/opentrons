import * as React from 'react'
import { Box, POSITION_STICKY, C_SELECTED_DARK } from '@opentrons/components'
import { useSelector } from 'react-redux'

import { getIsMultiSelectMode } from '../../ui/steps/selectors'
import { BatchEditForm } from '../BatchEditForm'
import { StepEditForm } from '../StepEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'

export const FormManager = (): JSX.Element => {
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)

  if (isMultiSelectMode) {
    return (
      <Box position={POSITION_STICKY} border={`2px solid ${C_SELECTED_DARK}`}>
        <StepSelectionBanner />
        <BatchEditForm />
      </Box>
    )
  }
  return <StepEditForm />
}
