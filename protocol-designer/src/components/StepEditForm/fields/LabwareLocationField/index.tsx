import { getModuleDisplayName } from '@opentrons/shared-data'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { i18n } from '../../../../localization'
import {
  getLabwareEntities,
  getModuleEntities,
} from '../../../../step-forms/selectors'
import {
  getRobotStateAtActiveItem,
  getUnocuppiedLabwareLocationOptions,
} from '../../../../top-selectors/labware-locations'
import { StepFormDropdown } from '../StepFormDropdownField'

export function LabwareLocationField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    useGripper: boolean
  } & { canSave: boolean } & { labware: string }
): JSX.Element {
  const labwareEntities = useSelector(getLabwareEntities)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const moduleEntities = useSelector(getModuleEntities)
  const isLabwarOffDeck =
    props.labware != null
      ? robotState?.labware[props.labware]?.slot === 'offDeck'
      : false

  let unoccupiedLabwareLocationsOptions =
    useSelector(getUnocuppiedLabwareLocationOptions) ?? []

  if (props.useGripper || isLabwarOffDeck) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  }
  const location: string = props.value as string

  const bothFieldsSelected = props.labware != null && props.value != null
  const labwareDisplayName =
    props.labware != null
      ? labwareEntities[props.labware]?.def.metadata.displayName
      : ''
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
