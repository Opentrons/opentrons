import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { selectors as stepFormSelectors } from '../../../../../step-forms'
import { getMatchingTipLiquidSpecs } from '../../../../../utils'
import { FlowRateInput } from './FlowRateInput'
import type { FieldProps } from '../types'
import type { FlowRateInputProps } from './FlowRateInput'

interface FlowRateFieldProps extends FieldProps {
  flowRateType: FlowRateInputProps['flowRateType']
  volume: unknown
  tiprack: unknown
  pipetteId?: string | null
}

export function FlowRateField(props: FlowRateFieldProps): JSX.Element {
  const {
    pipetteId,
    flowRateType,
    value,
    volume,
    tiprack,
    name,
    ...passThruProps
  } = props
  const { t } = useTranslation('shared')
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const pipette = pipetteId != null ? pipetteEntities[pipetteId] : null
  const pipetteDisplayName = pipette ? pipette.spec.displayName : t('pipette')
  const innerKey = `${name}:${String(value || 0)}`
  const matchingTipLiquidSpecs =
    pipette != null
      ? getMatchingTipLiquidSpecs(pipette, volume as number, tiprack as string)
      : null

  let defaultFlowRate
  if (pipette) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultAspirateFlowRate.default ?? 0
    } else if (flowRateType === 'dispense') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultDispenseFlowRate.default ?? 0
    } else if (flowRateType === 'blowout') {
      defaultFlowRate =
        matchingTipLiquidSpecs?.defaultBlowOutFlowRate.default ?? 0
    }
  }
  return (
    <FlowRateInput
      {...passThruProps}
      name={name}
      value={value}
      flowRateType={flowRateType}
      pipetteDisplayName={pipetteDisplayName}
      key={innerKey}
      defaultFlowRate={defaultFlowRate}
      minFlowRate={0}
      //  if uiMaxFlowRate does not exist then there is no maxFlowRate
      maxFlowRate={matchingTipLiquidSpecs?.uiMaxFlowRate ?? Infinity}
    />
  )
}
