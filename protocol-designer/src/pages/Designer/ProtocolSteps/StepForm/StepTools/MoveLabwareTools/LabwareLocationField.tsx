import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  OT2_SINGLE_SLOT_ADDRESSABLE_AREAS,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import {
  getUnoccupiedStackOptions,
  TIPRACK_LID_LOADNAME,
} from '/protocol-designer/pages/Designer/utils'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
} from '/protocol-designer/step-forms/selectors'
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
  getUnoccupiedLabwareLocationOptions,
} from '/protocol-designer/top-selectors/labware-locations'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import type { AddressableAreaName } from '@opentrons/shared-data'
import type { Option } from '/protocol-designer/top-selectors/labware-locations'
import type { FieldProps } from '../../types'

interface LabwareLocationFieldProps extends FieldProps {
  useGripper: boolean
  canSave: boolean
  labware: string
}
export function LabwareLocationField(
  props: LabwareLocationFieldProps
): JSX.Element {
  const { t } = useTranslation(['form', 'protocol_steps'])
  const { labware, useGripper } = props
  const { labware: deckSetupLabware } = useSelector(getDeckSetupForActiveItem)
  const dispatch = useDispatch()
  const labwareEntities = useSelector(getLabwareEntities)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const robotState = useSelector(getRobotStateAtActiveItem)
  const unoccupiedLabwareStackOptions: Option[] = robotState
    ? getUnoccupiedStackOptions({
        robotState,
        deckSetupLabware,
        labwareIdFromDropdown: labware,
        labwareEntities,
        t,
      })
    : []
  const isLabwareOffDeck =
    labware != null
      ? getSlotInLocationStack(robotState?.labware[labware]?.stack ?? []) ===
        'offDeck'
      : false
  const isLabwareALid =
    deckSetupLabware[labware]?.def.allowedRoles?.includes('lid') ?? false
  const isLabwareATiprackLid =
    deckSetupLabware[labware]?.def.parameters.loadName === TIPRACK_LID_LOADNAME
  const unoccupiedLabwareLocationsOptionsSelector =
    useSelector(getUnoccupiedLabwareLocationOptions) ?? []

  // invalid offDeck move filter
  let unoccupiedLabwareLocationsOptions = [
    ...unoccupiedLabwareStackOptions,
    ...unoccupiedLabwareLocationsOptionsSelector,
  ]
  if (useGripper || isLabwareOffDeck) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  }

  if (
    !useGripper &&
    Object.values(additionalEquipmentEntities).find(
      ae => ae.name === 'wasteChute'
    ) != null
  ) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== WASTE_CHUTE_CUTOUT
    )
  }

  if (!isLabwareALid) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.name !== 'Trash bin'
    )
  }
  const allSlotNames = [
    ...FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
    ...FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
    ...OT2_SINGLE_SLOT_ADDRESSABLE_AREAS,
  ]

  if (isLabwareATiprackLid) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => !allSlotNames.includes(option.value as AddressableAreaName)
    )
  }

  return (
    <DropdownStepFormField
      {...props}
      options={unoccupiedLabwareLocationsOptions}
      errorToShow={props.errorToShow}
      width="100%"
      title={t('protocol_steps:new_location')}
      onEnter={(id: string) => {
        dispatch(
          hoverSelection({
            id,
            text: t('application:new_location'),
          })
        )
      }}
      onExit={() => {
        dispatch(hoverSelection({ id: null, text: null }))
      }}
      tooltipContent={null}
      menuPlacement="bottom"
    />
  )
}
