import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  getIsDeckSlotCompatible,
  getIsLid,
  getIsTiprack,
  getModuleDisplayName,
  OT2_SINGLE_SLOT_ADDRESSABLE_AREAS,
  VACUUM_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  getFullStackFromLabwares,
  getIsVacuumSpacer,
  getSlotInLocationStack,
  VACUUM_DOCK_ADDRESSABLE_AREA,
  VACUUM_DOCK_LOCATION,
} from '@opentrons/step-generation'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { VACUUM_MODULE_SLOT } from '/protocol-designer/constants'
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
import { getIsAdapter } from '/protocol-designer/utils'

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
          const isCompatibleFromDefinition = compatibleParentLoadNames.has(
            labwareEntities[value].def.parameters.loadName
          )
          const { def: defToMoveTo } = labwareEntities[value]
          const isAllowedForUniversalLid =
            def.parameters.loadName === 'opentrons_tough_universal_lid' &&
            // moving to a non-lid is allowed implicitly
            !getIsLid(defToMoveTo)
          isCompatible = isCompatibleFromDefinition || isAllowedForUniversalLid
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

  const movingLabwareDef = labwareEntities[labware]?.def
  if (movingLabwareDef != null && !getIsDeckSlotCompatible(movingLabwareDef)) {
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

  // filter out movable adapters (e.g. collars) as destinations unless
  // compatible— filter plates can go anywhere, adapters with
  // providesStackingDefault accept any labware, otherwise fall back to
  // explicit compatibleParentLabware / stackingOffsetWithLabware
  const isTiprack = movingLabwareDef != null && getIsTiprack(movingLabwareDef)
  const isAdapter =
    movingLabwareDef != null && getIsAdapter(labware, labwareEntities)
  const isMovingLabwareFilterPlate =
    movingLabwareDef?.parameters.quirks?.includes('filterPlate') ?? false
  // filter plates cannot sit directly on the vacuum module
  if (isMovingLabwareFilterPlate) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        ({ value }) => moduleEntities[value]?.type !== VACUUM_MODULE_TYPE
      )
  }
  if (movingLabwareDef != null && !isMovingLabwareFilterPlate) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(({ value }) => {
        const destDef = labwareEntities[value]?.def
        if (destDef?.parameters.isMovableAdapter !== true) {
          return true
        }
        if (
          destDef.parameters.quirks?.includes('providesStackingDefault') &&
          !isTiprack &&
          !isAdapter
        ) {
          return true
        }
        const destLoadName = destDef.parameters.loadName
        return (
          movingLabwareDef.compatibleParentLabware?.includes(destLoadName) ||
          movingLabwareDef.stackingOffsetWithLabware?.[destLoadName] != null
        )
      })
  }

  const isLabwareVacuumDockCompatible =
    labwareEntities[labware]?.def.parameters.quirks?.includes(
      'vacuumModuleDock'
    ) ?? false
  const isLabwareVacuumSpacer =
    movingLabwareDef != null && getIsVacuumSpacer(movingLabwareDef)

  // only vacuumModuleDock-quirk labware can be moved to the vacuum dock
  if (!isLabwareVacuumDockCompatible) {
    unoccupiedLabwareLocationsOptions =
      unoccupiedLabwareLocationsOptions.filter(
        ({ value }) => value !== VACUUM_DOCK_ADDRESSABLE_AREA
      )
  }

  if (
    (isLabwareVacuumDockCompatible || isLabwareVacuumSpacer) &&
    robotState != null
  ) {
    const vacuumModuleEntry = Object.entries(moduleEntities).find(
      ([, entity]) => entity.type === VACUUM_MODULE_TYPE
    )
    if (vacuumModuleEntry != null) {
      const [vacuumModuleId, vacuumModuleEntity] = vacuumModuleEntry
      // labware physically on the main module slot ("A3")
      const labwareOnModule = Object.entries(robotState.labware).filter(
        ([, lw]) =>
          lw.stack.includes(vacuumModuleId) &&
          !lw.stack.includes(VACUUM_DOCK_LOCATION)
      )
      const vacuumModuleHasNoCollar = !labwareOnModule.some(([lwId]) => {
        return (
          labwareEntities[lwId]?.def.parameters.quirks?.includes(
            'vacuumModuleDock'
          ) ?? false
        )
      })

      // offer the vacuum module as a destination when it has no collar yet
      // (empty/exposed module is valid — a collar or a vacuum spacer can sit
      // directly on the module) forMoveLabware will build the full stack
      // including any existing module labware
      if (vacuumModuleHasNoCollar) {
        const isVacuumModuleAlreadyIncluded =
          unoccupiedLabwareLocationsOptions.some(
            ({ value }) => value === vacuumModuleId
          )
        if (!isVacuumModuleAlreadyIncluded) {
          unoccupiedLabwareLocationsOptions = [
            ...unoccupiedLabwareLocationsOptions,
            {
              name: getModuleDisplayName(vacuumModuleEntity.model),
              value: vacuumModuleId,
              deckLabel: VACUUM_MODULE_SLOT,
            },
          ]
        }
      }

      // collar can only go to the vacuum dock or the vacuum module main area
      // (when eligible); a vacuum spacer isn't restricted this way — it just
      // gains the empty main area as an extra option above
      if (isLabwareVacuumDockCompatible) {
        unoccupiedLabwareLocationsOptions =
          unoccupiedLabwareLocationsOptions.filter(
            ({ value }) =>
              value === VACUUM_DOCK_ADDRESSABLE_AREA ||
              (vacuumModuleHasNoCollar && value === vacuumModuleId)
          )
      }
    }
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
