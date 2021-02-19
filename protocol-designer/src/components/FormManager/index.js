// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { StepEditForm } from '../StepEditForm'
import { BatchEditForm } from '../BatchEditForm'
import { StepSelectionBanner } from '../StepSelectionBanner'
import {
  getCountPerStepType,
  getMultiSelectFieldValues,
} from '../../ui/steps/selectors'

export const FormManager = (): React.Node => {
  const fieldValues = useSelector(getMultiSelectFieldValues)
  const countPerStepType = useSelector(getCountPerStepType)

  // TODO(IL, 2021-02-17): dispatch changeBatchEditField here in #7222
  const handleChangeFormInput = (name, value) => {
    console.log(`TODO: update ${name}: ${String(value)}`)
  }

  if (fieldValues !== null) {
    // batch edit mode

    return (
      <>
        <StepSelectionBanner countPerStepType={countPerStepType} />
        <BatchEditForm
          countPerStepType={countPerStepType}
          fieldValues={fieldValues}
          handleChangeFormInput={handleChangeFormInput}
        />
      </>
    )
  }
  return <StepEditForm />
}
