import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import {
  CheckboxExpandStepFormField,
  DropdownStepFormField,
  InputStepFormField,
} from '/protocol-designer/components/molecules'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { getMaxDisposalVolumeForMultidispense } from '/protocol-designer/steplist/formLevel/handleFormChange/utils'
import { selectors as uiLabwareSelectors } from '/protocol-designer/ui/labware'

import { getBlowoutLocationOptionsForForm } from '../utils'
import { FlowRateField } from './FlowRateField'

import type {
  FormData,
  PathOption,
  StepType,
} from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../types'

interface DisposalFieldProps {
  path: PathOption
  pipette: string | null
  formData: FormData
  propsForFields: FieldPropsByName
  stepType: StepType
  volume: string | null
  aspirate_airGap_checkbox?: boolean | null
  aspirate_airGap_volume?: string | null
  tipRack?: string | null
}

export function DisposalField(props: DisposalFieldProps): JSX.Element {
  const {
    path,
    stepType,
    volume,
    pipette,
    propsForFields,
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    tipRack,
    formData,
  } = props
  const { t } = useTranslation(['application', 'form'])

  const disposalOptions = useSelector(uiLabwareSelectors.getDisposalOptions)
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const blowoutLocationOptions = getBlowoutLocationOptionsForForm({
    path,
    stepType,
  })
  const maxDisposalVolume = getMaxDisposalVolumeForMultidispense(
    {
      aspirate_airGap_checkbox,
      aspirate_airGap_volume,
      path,
      pipette,
      volume,
      tipRack,
    },
    pipetteEntities
  )
  const disposalDestinationOptions = [
    ...disposalOptions,
    ...blowoutLocationOptions,
  ]

  const volumeBoundsCaption =
    maxDisposalVolume != null
      ? t('protocol_steps:max_disposal_volume', {
          vol: maxDisposalVolume,
          unit: t('units.microliter'),
        })
      : ''

  const { value } = propsForFields.disposalVolume_checkbox
  return (
    <CheckboxExpandStepFormField
      title={t('protocol_steps:multi_dispense_options')}
      fieldProps={propsForFields.disposalVolume_checkbox}
    >
      {value ? (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing6}>
          <InputStepFormField
            {...propsForFields.disposalVolume_volume}
            title={t('protocol_steps:disposal_volume')}
            units={t('units.microliter')}
            padding="0"
            showTooltip={false}
            caption={volumeBoundsCaption}
          />
          <DropdownStepFormField
            {...propsForFields.blowout_location}
            options={disposalDestinationOptions}
            title={t('protocol_steps:blowout_location')}
            padding="0"
            width="100%"
          />
          <FlowRateField
            {...propsForFields.blowout_flowRate}
            pipetteId={pipette}
            flowRateType="blowout"
            volume={propsForFields.volume?.value ?? 0}
            padding="0"
            tiprack={propsForFields.tipRack.value}
            formData={formData}
          />
        </Flex>
      ) : null}
    </CheckboxExpandStepFormField>
  )
}
