import * as React from 'react'
import { DIRECTION_COLUMN, Flex } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getEnableReturnTip } from '../../../../../../feature-flags/selectors'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { Line } from '../../../../../../atoms'

import {
  ChangeTipField,
  LabwareField,
  PartialTipField,
  PathField,
  PipetteField,
  TiprackField,
  WellSelectionField,
  VolumeField,
} from '../../PipetteFields'
import type { StepFormProps } from '../../types'

export function MoveLiquidTools(props: StepFormProps): JSX.Element {
  const { toolboxStep, propsForFields, formData } = props
  const { stepType, path } = formData
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const [collapsed, _setCollapsed] = React.useState<boolean>(true)
  const enableReturnTip = useSelector(getEnableReturnTip)
  const labwares = useSelector(getLabwareEntities)
  const pipettes = useSelector(getPipetteEntities)
  const toggleCollapsed = (): void => {
    _setCollapsed(!collapsed)
  }
  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null

  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'

  return toolboxStep === 1 ? (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <PipetteField {...propsForFields.pipette} />
      <Line />
      {is96Channel ? <PartialTipField {...propsForFields.nozzles} /> : null}
      <Line />
      <TiprackField
        {...propsForFields.tipRack}
        pipetteId={propsForFields.pipette.value}
      />
      <Line /> <VolumeField {...propsForFields.volume} />
      <Line />
      <LabwareField {...propsForFields.aspirate_labware} />
      <Line />
      <WellSelectionField
        {...propsForFields.aspirate_wells}
        labwareId={String(propsForFields.aspirate_labware.value)}
        pipetteId={formData.pipette}
        nozzles={String(propsForFields.nozzles.value) ?? null}
      />
      <Line />
      <LabwareField {...propsForFields.dispense_labware} />
      <Line />
      <WellSelectionField
        {...propsForFields.dispense_wells}
        labwareId={String(propsForFields.dispense_labware.value)}
        pipetteId={formData.pipette}
        nozzles={String(propsForFields.nozzles.value) ?? null}
      />
      <Line />
      <ChangeTipField
        {...propsForFields.changeTip}
        aspirateWells={formData.aspirate_wells}
        dispenseWells={formData.dispense_wells}
        path={formData.path}
        stepType={formData.stepType}
      />
      <Line />
      <PathField
        {...propsForFields.path}
        aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
        aspirate_airGap_volume={formData.aspirate_airGap_volume}
        aspirate_wells={formData.aspirate_wells}
        changeTip={formData.changeTip}
        dispense_wells={formData.dispense_wells}
        pipette={formData.pipette}
        volume={formData.volume}
        tipRack={formData.tipRack}
      />
    </Flex>
  ) : (
    <div>wire this up</div>
  )
}
