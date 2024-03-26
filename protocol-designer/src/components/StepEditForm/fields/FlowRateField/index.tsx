import * as React from 'react'
import { FlowRateInput, FlowRateInputProps } from './FlowRateInput'
import { useSelector } from 'react-redux'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { FieldProps } from '../../types'
import { getMatchingTipLiquidSpecs } from '../../../../utils'

interface OP extends FieldProps {
  flowRateType: FlowRateInputProps['flowRateType']
  volume: unknown
  pipetteId?: string | null
  className?: FlowRateInputProps['className']
  label?: FlowRateInputProps['label']
}

// Add a key to force re-constructing component when values change
export function FlowRateField(props: OP): JSX.Element {
  const { pipetteId, flowRateType, value, volume, ...passThruProps } = props
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null
  const pipetteDisplayName = pipette ? pipette.spec.displayName : 'pipette'
  const innerKey = `${name}:${String(value || 0)}`
  const matchingTipLiquidSpecs =
    pipette != null
      ? getMatchingTipLiquidSpecs(pipette, volume as number)
      : null

  let defaultFlowRate
  if (pipette) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultAspirateFlowRate.default ?? 0
    } else if (flowRateType === 'dispense') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultDispenseFlowRate.default ?? 0
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
      //  TODO(jr, 3/21/24): update max flow rate to real value instead of volume
      maxFlowRate={pipette ? pipette.spec.liquids.default.maxVolume : Infinity}
    />
  )
}
