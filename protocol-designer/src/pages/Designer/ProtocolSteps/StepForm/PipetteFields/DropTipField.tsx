import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ALL, COLUMN, SINGLE } from '@opentrons/shared-data'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getEnableAdditionalPartialTipSelection } from '/protocol-designer/feature-flags/selectors'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'

import type { DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteChannels,
} from '@opentrons/shared-data'
import type { FieldProps } from '../types'

interface DropTipFieldProps extends FieldProps {
  nozzles: NozzleConfigurationStyle | null
  channels: PipetteChannels
  tiprackDefUri: string
}

export function DropTipField(props: DropTipFieldProps): JSX.Element {
  const {
    value: dropdownItem,
    updateValue,
    nozzles,
    tiprackDefUri,
    channels,
  } = props
  const { t, i18n } = useTranslation(['form', 'shared'])
  const additionalEquipment = useSelector(getAdditionalEquipmentEntities)
  const labwareEntities = useSelector(getLabwareEntities)

  const wasteChute = Object.values(additionalEquipment).find(
    aE => aE.name === 'wasteChute'
  )
  const trashBin = Object.values(additionalEquipment).find(
    aE => aE.name === 'trashBin'
  )
  const wasteChuteOption: DropdownOption = {
    name: t('shared:wasteChute'),
    value: wasteChute?.id ?? '',
  }
  const trashOption: DropdownOption = {
    name: t('shared:trashBin'),
    value: trashBin?.id ?? '',
  }

  const options: DropdownOption[] = []
  if (wasteChute != null) options.push(wasteChuteOption)
  if (trashBin != null) options.push(trashOption)

  const returnOption: DropdownOption = {
    name: t('form:step_edit_form.field.dropTip.option.return'),
    value: tiprackDefUri,
  }
  const enableAdditionalPartialTip = useSelector(
    getEnableAdditionalPartialTipSelection
  )
  const isReturnTipValid =
    nozzles === ALL ||
    nozzles == null ||
    (channels === 1 && nozzles === SINGLE) ||
    (enableAdditionalPartialTip ? nozzles === COLUMN && channels === 96 : false)

  const isTipDropLocationReturnTip = Object.values(labwareEntities).some(
    ({ labwareDefURI }) => labwareDefURI === tiprackDefUri
  )

  useEffect(() => {
    if (
      additionalEquipment[String(dropdownItem)] == null &&
      labwareEntities[String(dropdownItem)] == null &&
      !isTipDropLocationReturnTip
    ) {
      updateValue(null)
    }
  }, [dropdownItem])

  return (
    <DropdownStepFormField
      {...props}
      updateValue={updateValue}
      options={isReturnTipValid ? [...options, returnOption] : options}
      value={dropdownItem ? String(dropdownItem) : null}
      title={i18n.format(
        t('step_edit_form.field.location.dropTip'),
        'capitalize'
      )}
      width="100%"
    />
  )
}
