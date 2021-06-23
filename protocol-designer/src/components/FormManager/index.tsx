import * as React from 'react'
import { useSelector } from 'react-redux'
import { Box, POSITION_STICKY, C_SELECTED_DARK } from '@opentrons/components'
import { StepEditForm } from '../StepEditForm'
import { BatchEditForm } from '../BatchEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'
import { getIsMultiSelectMode } from '../../ui/steps/selectors'

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
