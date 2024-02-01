import * as React from 'react'
import { FlowRateInput, FlowRateInputProps } from './FlowRateInput'
import { useSelector } from 'react-redux'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { FieldProps } from '../../types'

interface OP extends FieldProps {
  pipetteId?: string | null
  className?: FlowRateInputProps['className']
  flowRateType: FlowRateInputProps['flowRateType']
  label?: FlowRateInputProps['label']
}

// Add a key to force re-constructing component when values change
export function FlowRateField(props: OP): JSX.Element {
  const { pipetteId, flowRateType, value, ...passThruProps } = props
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null
  const pipetteDisplayName = pipette ? pipette.spec.displayName : 'pipette'
  const innerKey = `${name}:${String(value || 0)}`
  let defaultFlowRate
  if (pipette) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate = pipette.spec.defaultAspirateFlowRate.value
    } else if (flowRateType === 'dispense') {
      defaultFlowRate = pipette.spec.defaultDispenseFlowRate.value
    }
  }

  return (
    <FlowRateInput
      {...passThruProps}
      value={value}
      flowRateType={flowRateType}
      pipetteDisplayName={pipetteDisplayName}
      key={innerKey}
      defaultFlowRate={defaultFlowRate}
      minFlowRate={0}
      maxFlowRate={pipette ? pipette.spec.maxVolume : Infinity}
    />
  )
}
