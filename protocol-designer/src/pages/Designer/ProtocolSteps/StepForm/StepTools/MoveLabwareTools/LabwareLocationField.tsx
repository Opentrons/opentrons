import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  OT2_SINGLE_SLOT_ADDRESSABLE_AREAS,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  getFullStackFromLabwares,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import {
  getUnoccupiedStackOptions,
  TIPRACK_LID_LOADNAME,
} from '/protocol-designer/pages/Designer/utils'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getModuleEntities,
} from '/protocol-designer/step-forms/selectors'
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
  getUnoccupiedLabwareLocationOptions,
} from '/protocol-designer/top-selectors/labware-locations'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { getSortedAddressableArea } from './utils'

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
  const moduleEntities = useSelector(getModuleEntities)
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
  const labwareSlot = getSlotInLocationStack(
    robotState?.labware[labware]?.stack ?? []
  )
  const isLabwareOffDeck = labware != null ? labwareSlot === 'offDeck' : false
  const isLabwareALid =
    deckSetupLabware[labware]?.def.allowedRoles?.includes('lid') ?? false
  const isLabwareATiprackLid =
    deckSetupLabware[labware]?.def.parameters.loadName === TIPRACK_LID_LOADNAME
  const unoccupiedLabwareLocationsOptionsSelector =
    useSelector(getUnoccupiedLabwareLocationOptions) ?? []
  const fullStackFromLabwares = getFullStackFromLabwares(
    robotState?.labware ?? {},
    labwareSlot,
    labware
  )
  const stackHasANonTiprackLid = fullStackFromLabwares.some(id => {
    if (!(id in labwareEntities)) {
      return false
    }
    const { def } = labwareEntities[id]
    const isLid = def.allowedRoles?.includes('lid') ?? false
    return isLid && def.parameters.loadName !== TIPRACK_LID_LOADNAME
  })

  const robotType = useSelector(getRobotType)
  // invalid offDeck move filter
  let unoccupiedLabwareLocationsOptions = [
    ...unoccupiedLabwareStackOptions,
    ...unoccupiedLabwareLocationsOptionsSelector,
  ]
  if (useGripper || isLabwareOffDeck) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        option => option.value !== 'offDeck' && option.deckLabel !== 'offDeck'
      )
  }

  if (
    !useGripper &&
    Object.values(additionalEquipmentEntities).find(
      ae => ae.name === 'wasteChute'
    ) != null
  ) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        option => option.value !== WASTE_CHUTE_CUTOUT
      )
  }

  // check lid-compatible labware and modules
  if (isLabwareALid) {
    const def = labwareEntities[labware]?.def
    const compatibleParentLoadNames = new Set([
      ...(def?.compatibleParentLabware ?? []),
      ...Object.keys(def?.stackingOffsetWithLabware ?? {}),
      ...Object.keys(def?.stackingOffsetWithModule ?? {}),
    ])
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(({ value, name }) => {
        let isCompatible = true
        if (value in moduleEntities) {
          isCompatible = compatibleParentLoadNames.has(
            moduleEntities[value].model
          )
        } else if (value in labwareEntities) {
          isCompatible = compatibleParentLoadNames.has(
            labwareEntities[value].def.parameters.loadName
          )
        }
        return isCompatible
      })
  } else {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        option => option.name !== 'Trash bin'
      )
  }
  const allSlotNames = [
    ...FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
    ...FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
    ...OT2_SINGLE_SLOT_ADDRESSABLE_AREAS,
  ]

  if (isLabwareATiprackLid) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        option => !allSlotNames.includes(option.value as AddressableAreaName)
      )
  }

  if (stackHasANonTiprackLid) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        ({ value }) =>
          robotState?.modules?.[value]?.moduleState.type !==
          FLEX_STACKER_MODULE_TYPE
      )
  }

  const optionsSorted =
    robotState != null
      ? getSortedAddressableArea(
          unoccupiedLabwareLocationsOptions,
          robotState,
          robotType
        )
      : unoccupiedLabwareLocationsOptions

  return (
    <DropdownStepFormField
      {...props}
      options={optionsSorted}
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
      // to force menu to be positioned below field instead of above
      menuPlacement="bottom"
    />
  )
}
