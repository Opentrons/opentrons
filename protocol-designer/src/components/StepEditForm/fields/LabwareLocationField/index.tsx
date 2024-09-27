import type * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  WASTE_CHUTE_CUTOUT,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getModuleEntities,
} from '../../../../step-forms/selectors'
import {
  getRobotStateAtActiveItem,
  getUnoccupiedLabwareLocationOptions,
} from '../../../../top-selectors/labware-locations'
import { StepFormDropdown } from '../StepFormDropdownField'
import { getHasWasteChute } from '../../../labware'

export function LabwareLocationField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    useGripper: boolean
  } & { canSave: boolean } & { labware: string }
): JSX.Element {
  const { labware, useGripper, value } = props
  const { t } = useTranslation('form')
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const labwareEntities = useSelector(getLabwareEntities)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const moduleEntities = useSelector(getModuleEntities)
  const isLabwareOffDeck =
    labware != null ? robotState?.labware[labware]?.slot === 'offDeck' : false

  let unoccupiedLabwareLocationsOptions =
    useSelector(getUnoccupiedLabwareLocationOptions) ?? []

  if (useGripper || isLabwareOffDeck) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  }

  if (!useGripper && getHasWasteChute(additionalEquipmentEntities)) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== WASTE_CHUTE_CUTOUT
    )
  }

  const location: string = value as string

  const bothFieldsSelected = labware != null && value != null
  const labwareDisplayName =
    labware != null ? labwareEntities[labware]?.def.metadata.displayName : ''
  let locationString = `slot ${location}`
  if (location != null) {
    if (robotState?.modules[location] != null) {
      const moduleSlot = robotState?.modules[location].slot ?? ''
      locationString = `${getModuleDisplayName(
        moduleEntities[location].model
      )} in slot ${moduleSlot}`
    } else if (robotState?.labware[location] != null) {
      const adapterSlot = robotState?.labware[location].slot
      locationString =
        robotState?.modules[adapterSlot] != null
          ? `${getModuleDisplayName(
              moduleEntities[adapterSlot].model
            )} in slot ${robotState?.modules[adapterSlot].slot}`
          : `slot ${robotState?.labware[location].slot}` ?? ''
    }
  }
  return (
    <StepFormDropdown
      {...props}
      errorToShow={
        !props.canSave && bothFieldsSelected
          ? t('step_edit_form.labwareLabel.errors.labwareSlotIncompatible', {
              labwareName: labwareDisplayName,
              slot: locationString,
            })
          : undefined
      }
      options={unoccupiedLabwareLocationsOptions}
    />
  )
}
