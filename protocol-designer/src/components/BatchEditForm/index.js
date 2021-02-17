// @flow
import * as React from 'react'
import type { MultiselectFieldValues } from '../../ui/steps/selectors'
import type { CountPerStepType } from '../../form-types'

export type BatchEditFormProps = {|
  countPerType: CountPerStepType,
  fieldValues: null | MultiselectFieldValues,
|}

export const BatchEditMoveLiquid = (): React.Node => {
  return <div>TODO batch edit form for Transfer step goes here</div>
}

export const BatchEditForm = (props: BatchEditFormProps): React.Node => {
  const { countPerType } = props

  // TODO IMMEDIATELY some unit-tested util for this line
  const selectedStepTypes = Object.keys(countPerType).filter(
    stepType => countPerType[stepType] > 0
  )
  if (selectedStepTypes.length !== 1) {
    return (
      <div>
        Multiple step types not supported. Select only transfers etc (TODO real
        message goes here)
      </div>
    )
  }

  const selectedSingleStepType = selectedStepTypes[0]
  if (selectedSingleStepType === 'moveLiquid') {
    return <BatchEditMoveLiquid />
  }
  return (
    <div>{`${selectedSingleStepType} not supported (TODO real message goes here)`}</div>
  )
}
