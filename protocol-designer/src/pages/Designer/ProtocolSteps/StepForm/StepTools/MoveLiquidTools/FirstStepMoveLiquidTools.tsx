import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DIRECTION_COLUMN, Divider, Flex, SPACING } from '@opentrons/components'

import {
  getAdditionalEquipmentEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'

import {
  LabwareField,
  PathField,
  PipetteField,
  TiprackField,
  VolumeField,
} from '../../PipetteFields'
import { ExtendedPartialTipField } from '../../PipetteFields/NozzleAndWellSelectionModal/ExtendedPartialTipField'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface FirstStepMoveLiquidToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
}

export function FirstStepMoveLiquidTools({
  propsForFields,
  formData,
}: FirstStepMoveLiquidToolsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const pipettes = useSelector(getPipetteEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const completedSteps =
    formData.aspirate_labware != null &&
    formData.dispense_labware != null &&
    formData.tipRack != null &&
    formData.pipette != null
  const { pipette, tipRack } = propsForFields
  const isDisposalLocation =
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'wasteChute' ||
    additionalEquipmentEntities[String(propsForFields.dispense_labware.value)]
      ?.name === 'trashBin'

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      <PipetteField {...propsForFields.pipette} />
      <Divider marginY="0" />
      <TiprackField {...tipRack} pipetteId={pipette.value} />
      <Divider marginY="0" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <LabwareField {...propsForFields.aspirate_labware} />
      </Flex>
      <Divider marginY="0" />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
        <LabwareField {...propsForFields.dispense_labware} />
        {completedSteps ? (
          <>
            <Divider marginY="0" />
            <ExtendedPartialTipField
              {...propsForFields.nozzles}
              pipetteSpecs={
                pipettes[String(propsForFields.pipette.value)]?.spec
              }
              propsForFields={propsForFields}
              stepType="transfer"
            />
            <Divider marginY="0" />
          </>
        ) : null}
      </Flex>

      {completedSteps ? (
        <>
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
            isDisposalLocation={isDisposalLocation}
            title={t('pipette_path')}
          />
          <Divider marginY="0" />
          <VolumeField
            fieldProps={propsForFields.volume}
            path={formData.path}
            stepType={formData.stepType}
          />
        </>
      ) : null}
    </Flex>
  )
}
