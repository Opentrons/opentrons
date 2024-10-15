import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Divider, Flex } from '@opentrons/components'
import { InputStepFormField } from '../../../../../../molecules'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { getEnableReturnTip } from '../../../../../../feature-flags/selectors'
import {
  ChangeTipField,
  DropTipField,
  LabwareField,
  PartialTipField,
  PickUpTipField,
  PipetteField,
  TipWellSelectionField,
  TiprackField,
  VolumeField,
  WellSelectionField,
} from '../../PipetteFields'
import type { StepFormProps } from '../../types'

export function MixTools(props: StepFormProps): JSX.Element {
  const pipettes = useSelector(getPipetteEntities)
  const enableReturnTip = useSelector(getEnableReturnTip)
  const labwares = useSelector(getLabwareEntities)
  const { t } = useTranslation(['application', 'form'])

  const { propsForFields, formData, toolboxStep } = props
  const is96Channel =
    propsForFields.pipette.value != null &&
    pipettes[String(propsForFields.pipette.value)].name === 'p1000_96'
  const userSelectedPickUpTipLocation =
    labwares[String(propsForFields.pickUpTip_location.value)] != null
  const userSelectedDropTipLocation =
    labwares[String(propsForFields.dropTip_location.value)] != null

  return toolboxStep === 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <PipetteField {...propsForFields.pipette} />
      {is96Channel ? <PartialTipField {...propsForFields.nozzles} /> : null}
      <Divider marginY="0" />
      <TiprackField
        {...propsForFields.tipRack}
        pipetteId={propsForFields.pipette.value}
      />
      <Divider marginY="0" />
      <LabwareField {...propsForFields.labware} />
      <Divider marginY="0" />
      <Divider marginY="0" />
      <WellSelectionField
        {...propsForFields.wells}
        labwareId={formData.labware}
        pipetteId={formData.pipette}
        nozzles={String(propsForFields.nozzles.value) ?? null}
      />
      <Divider marginY="0" />
      <VolumeField {...propsForFields.volume} />
      <Divider marginY="0" />
      <InputStepFormField
        {...propsForFields.times}
        units={t('units.times')}
        title={t('protocol_steps:mix_repetitions')}
      />
      <Divider marginY="0" />
      <ChangeTipField
        {...propsForFields.changeTip}
        aspirateWells={formData.aspirate_wells}
        dispenseWells={formData.dispense_wells}
        path={formData.path}
        stepType={formData.stepType}
      />
      <Divider marginY="0" />
      {enableReturnTip ? (
        <>
          <PickUpTipField {...propsForFields.pickUpTip_location} />
          {userSelectedPickUpTipLocation ? (
            <>
              <Divider marginY="0" />
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
      <Divider marginY="0" />
      <DropTipField {...propsForFields.dropTip_location} />
      {userSelectedDropTipLocation && enableReturnTip ? (
        <>
          <Divider marginY="0" />
          <TipWellSelectionField
            {...propsForFields.dropTip_wellNames}
            nozzles={String(propsForFields.nozzles.value) ?? null}
            labwareId={propsForFields.dropTip_location.value}
            pipetteId={propsForFields.pipette.value}
          />
        </>
      ) : null}
    </Flex>
  ) : (
    <div>wire this up</div>
  )
}
