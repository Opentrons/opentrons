import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  getModuleDisplayName,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { i18n } from '../../../../localization'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getModuleEntities,
} from '../../../../step-forms/selectors'
import {
  getRobotStateAtActiveItem,
  getUnocuppiedLabwareLocationOptions,
} from '../../../../top-selectors/labware-locations'
import { getHasWasteChute } from '../../../labware'
import { StepFormDropdown } from '../StepFormDropdownField'

export function LabwareLocationField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    useGripper: boolean
  } & { canSave: boolean } & { labware: string }
): JSX.Element {
  const { labware, useGripper, value } = props
  const labwareEntities = useSelector(getLabwareEntities)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const moduleEntities = useSelector(getModuleEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const hasWasteChute = getHasWasteChute(additionalEquipmentEntities)
  const isLabwareOffDeck =
    labware != null ? robotState?.labware[labware]?.slot === 'offDeck' : false
  const displayWasteChuteValue =
    useGripper && hasWasteChute && !isLabwareOffDeck

  let unoccupiedLabwareLocationsOptions =
    useSelector(getUnocuppiedLabwareLocationOptions) ?? []

  if (isLabwareOffDeck && hasWasteChute) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option =>
        option.value !== 'offDeck' && option.value !== WASTE_CHUTE_CUTOUT
    )
  } else if (useGripper || isLabwareOffDeck) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  } else if (!displayWasteChuteValue) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.name !== 'Waste Chute in D3'
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
          ? i18n.t(
              'form.step_edit_form.labwareLabel.errors.labwareSlotIncompatible',
              { labwareName: labwareDisplayName, slot: locationString }
            )
          : undefined
      }
      options={unoccupiedLabwareLocationsOptions}
    />
  )
}
