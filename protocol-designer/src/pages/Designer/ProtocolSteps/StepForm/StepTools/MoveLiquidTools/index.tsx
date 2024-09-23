import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DIRECTION_COLUMN, Flex } from '@opentrons/components'
import { getEnableReturnTip } from '../../../../../../feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { Line } from '../../../../../../atoms'
import {
  ChangeTipField,
  DropTipField,
  LabwareField,
  PartialTipField,
  PathField,
  PickUpTipField,
  PipetteField,
  TiprackField,
  TipWellSelectionField,
  VolumeField,
  WellSelectionField,
} from '../../PipetteFields'
import type { StepFormProps } from '../../types'

export function MoveLiquidTools(props: StepFormProps): JSX.Element {
  const { toolboxStep, propsForFields, formData } = props
  const { stepType, path } = formData
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const [collapsed, _setCollapsed] = useState<boolean>(true)
  //  TODO: these will be used for the 2nd page advanced settings
  // const { stepType, path } = formData
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const enableReturnTip = useSelector(getEnableReturnTip)
  const labwares = useSelector(getLabwareEntities)
  const pipettes = useSelector(getPipetteEntities)

  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null

  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'
  const isDisposalLocation =
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'wasteChute' ||
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'trashBin'

  return toolboxStep === 0 ? (
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
      {isDisposalLocation ? null : (
        <WellSelectionField
          {...propsForFields.dispense_wells}
          labwareId={String(propsForFields.dispense_labware.value)}
          pipetteId={formData.pipette}
          nozzles={String(propsForFields.nozzles.value) ?? null}
        />
      )}
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
      <Line />
      {enableReturnTip ? (
        <>
          <PickUpTipField {...propsForFields.pickUpTip_location} />
          {userSelectedPickUpTipLocation ? (
            <>
              <Line />
              <TipWellSelectionField
                {...propsForFields.pickUpTip_wellNames}
                nozzles={String(propsForFields.nozzles.value) ?? null}
                labwareId={propsForFields.pickUpTip_location.value}
                pipetteId={propsForFields.pipette.value}
              />
            </>
          ) : null}
        </>
      ) : null}
      <Line />
      <DropTipField {...propsForFields.dropTip_location} />
      {userSelectedDropTipLocation && enableReturnTip ? (
        <>
          <Line />
          <TipWellSelectionField
            {...propsForFields.dropTip_wellNames}
            nozzles={String(propsForFields.nozzles.value) ?? null}
            labwareId={propsForFields.dropTip_location.value}
            pipetteId={propsForFields.pipette.value}
          />
        </>
      ) : null}
      <Line />
    </Flex>
  ) : (
    //  TODO: wire up the second page
    <div>wire this up</div>
  )
}
