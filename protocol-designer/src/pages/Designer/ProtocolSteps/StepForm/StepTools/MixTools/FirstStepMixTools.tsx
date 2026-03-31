import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Divider, Flex, SPACING } from '@opentrons/components'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import {
  LabwareField,
  PipetteField,
  TiprackField,
  VolumeField,
} from '../../PipetteFields'
import { ExtendedPartialTipField } from '../../PipetteFields/NozzleAndWellSelectionModal/ExtendedPartialTipField'

import type { PipetteEntities } from '@opentrons/step-generation'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface FirstStepMixToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  pipettes: PipetteEntities
}

export function FirstStepMixTools({
  propsForFields,
  formData,
  pipettes,
}: FirstStepMixToolsProps): JSX.Element {
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const completedSteps =
    formData.labware != null &&
    formData.tipRack != null &&
    formData.pipette != null

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      <PipetteField {...propsForFields.pipette} />
      <Divider marginY="0" />
      <TiprackField
        {...propsForFields.tipRack}
        pipetteId={propsForFields.pipette.value}
      />
      <Divider marginY="0" />
      <LabwareField {...propsForFields.labware} tooltipContent={null} />
      {completedSteps ? (
        <>
          <Divider marginY="0" />
          <ExtendedPartialTipField
            {...propsForFields.nozzles}
            pipetteSpecs={pipettes[String(propsForFields.pipette.value)]?.spec}
            propsForFields={propsForFields}
            stepType="mix"
          />
        </>
      ) : null}

      {completedSteps ? (
        <>
          <Divider marginY="0" />
          <VolumeField
            fieldProps={propsForFields.volume}
            stepType={formData.stepType}
          />
          <Divider marginY="0" />
          <InputStepFormField
            {...propsForFields.times}
            units={t('units.repetitions')}
            title={t('protocol_steps:mix_repetitions')}
            showTooltip={false}
          />
        </>
      ) : null}
    </Flex>
  )
}
