import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import reduce from 'lodash/reduce'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getAllDefinitions,
  getIsLid,
  getIsPipettableLabware,
  getIsTiprack,
  getPositionFromSlotId,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  SYSTEM_LOCATION,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getFullStackFromLabwares,
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
  getIsVacuumSpacer,
  getSlotInLocationStack,
  VACUUM_DOCK_ADDRESSABLE_AREA,
} from '@opentrons/step-generation'

import {
  HOPPER_LABWARE_X_OFFSET,
  VACUUM_DOCK_DISPLAY_LOCATION,
} from '/protocol-designer/constants'

import { getRobotType } from '../../file-data/selectors'
import { getLabwareEntities } from '../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { getLabwareNicknamesById } from '../../ui/labware/selectors'
import {
  getAllLabwareIdsOfCertainURIOnStack,
  getFullStackFromLabwaresOnDeck,
  getIsAdapter,
  getStagingAreaAddressableAreas,
} from '../../utils'
import { getIsVacuumCollar } from './DeckSetup/utils'

import type { DropdownOption } from '@opentrons/components'
import type {
  AddressableAreaName,
  CoordinateTuple,
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentName,
  DeckSlot,
  HopperLocationMapKey,
  LabwareEntities,
  LabwareEntity,
  RobotState,
} from '@opentrons/step-generation'
import type {
  AllTemporalPropertiesForTimelineFrame,
  InitialDeckSetup,
  LabwareOnDeck,
  ModuleOnDeck,
} from '../../step-forms'
import type { Option } from '../../top-selectors/labware-locations'
import type { Fixture } from './DeckSetup/constants'

export const TIPRACK_LID_LOADNAME = 'opentrons_flex_tiprack_lid'
export const TC_LID_LOADNAME = 'opentrons_tough_pcr_auto_sealing_lid'

export interface AdditionalEquipment {
  name: AdditionalEquipmentName
  id: string
  location?: string
}

interface SlotInformation {
  createdStackForSlot: string[]
  matchingLabwareFor4thColumn: LabwareOnDeck | null
  slotPosition: CoordinateTuple | null
  isSlotAHopper: boolean
  isSlotAVacuumDock: boolean
  createdModuleForSlot?: ModuleOnDeck
  createdAdapterForSlot?: LabwareOnDeck
  createdFixtureForSlots?: AdditionalEquipment[]
  preSelectedFixture?: Fixture
  createdLidForSlot?: LabwareOnDeck
}

interface SlotInformationProps {
  deckSetup: AllTemporalPropertiesForTimelineFrame
  slot: DeckSlot
  deckDef?: DeckDefinition
  pendingCreationStateForHopper?: boolean
}

const FOURTH_COLUMN_SLOTS = ['A4', 'B4', 'C4', 'D4']
const FOURTH_COLUMN_CONVERSION = { A4: 'A3', B4: 'B3', C4: 'C3', D4: 'D3' }

const _getAdjustedSlot = (
  slot: DeckSlot,
  isSlotAVacuumDock: boolean,
  isSlotAHopper: boolean
): string => {
  if (isSlotAVacuumDock) {
    return slot
  }
  if (isSlotAHopper) {
    return FAKE_HOPPER_LOCATION_MAP[slot as HopperLocationMapKey]
  }
  return slot
}
const _getOffsetFromSlot = (slot: DeckSlot, isSlotAHopper: boolean): number => {
  if (isSlotAHopper) {
    return HOPPER_LABWARE_X_OFFSET
  }
  return 0
}

export const getSlotInformation = (
  props: SlotInformationProps
): SlotInformation => {
  const {
    slot,
    deckSetup,
    deckDef,
    pendingCreationStateForHopper = false,
  } = props
  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup
  const latestDefs = getAllDefinitions()
  const lidLoadNames = Object.values(latestDefs)
    .filter(def => def.allowedRoles?.includes('lid'))
    ?.map(def => def.parameters.loadName)
  const offDeckLabware = deckSetupLabware[slot]
  const isSlotAVacuumDock = getIsSlotAVacuumDock(slot)
  const isSlotAHopper = getIsSlotAHopper(slot)
  const adjustedSlot = _getAdjustedSlot(slot, isSlotAVacuumDock, isSlotAHopper)
  const slotPosition =
    deckDef != null && offDeckLabware == null
      ? getPositionFromSlotId(
          adjustedSlot,
          deckDef,
          _getOffsetFromSlot(slot, isSlotAHopper)
        )
      : null
  const createdModuleForSlot = Object.values(deckSetupModules).find(
    module => module.slot === adjustedSlot
  )
  // we need to pend the creation of new labware on the hopper to prevent
  // a white screen where we are looking for labware that don't yet exist
  // in the protocol.
  const fullStackFromLabwares = pendingCreationStateForHopper
    ? []
    : getFullStackFromLabwaresOnDeck(
        Object.values(deckSetupLabware),
        slot,
        isSlotAHopper,
        isSlotAVacuumDock
      )
  const labwareStackOnSlot =
    fullStackFromLabwares?.filter(
      id =>
        deckSetupLabware[id] != null &&
        deckSetupLabware[id].def.parameters.loadName !==
          'opentrons_flex_deck_riser'
    ) ?? []

  const numOfTcLidsOnStack =
    fullStackFromLabwares?.filter(
      id =>
        deckSetupLabware[id] != null &&
        lidLoadNames.includes(deckSetupLabware[id].def.parameters.loadName) &&
        deckSetupLabware[id].def.parameters.loadName !== TIPRACK_LID_LOADNAME
    )?.length ?? 0
  const labwareIdsFromFullStack =
    fullStackFromLabwares?.filter(
      id =>
        deckSetupLabware[id] != null &&
        //  remove lid from stack if its a labware + lid
        (numOfTcLidsOnStack === 1 && labwareStackOnSlot.length > 1
          ? !lidLoadNames.includes(deckSetupLabware[id].def.parameters.loadName)
          : //  otherwise, count lid in stack if its a stack of lids
            deckSetupLabware[id].def.parameters.loadName !==
            TIPRACK_LID_LOADNAME)
    ) ?? []

  const lidIdFromStack = fullStackFromLabwares?.find(id =>
    numOfTcLidsOnStack === 1
      ? lidLoadNames.includes(deckSetupLabware[id].def.parameters.loadName)
      : deckSetupLabware[id]?.def.parameters.loadName === TIPRACK_LID_LOADNAME
  )

  // For vacuum module, don't separate adapters from the stack since multiple adapters can be stacked
  const isVacuumModule = createdModuleForSlot?.type === VACUUM_MODULE_TYPE

  const bottomMostLabware =
    deckSetupLabware[
      labwareIdsFromFullStack[labwareIdsFromFullStack.length - 1]
    ]
  const createdAdapterForSlot =
    !isVacuumModule &&
    bottomMostLabware != null &&
    bottomMostLabware.def.allowedRoles?.includes('adapter')
      ? bottomMostLabware
      : undefined
  const remainingLabwareIds =
    createdAdapterForSlot != null
      ? labwareIdsFromFullStack.slice(0, -1)
      : labwareIdsFromFullStack

  const createdFixtureForSlots = Object.values(
    additionalEquipmentOnDeck
  ).filter(ae => {
    const slotKey = FOURTH_COLUMN_SLOTS.includes(slot)
      ? FOURTH_COLUMN_CONVERSION[slot as keyof typeof FOURTH_COLUMN_CONVERSION]
      : slot
    return ae.location?.split('cutout')[1] === slotKey
  })

  const fixturesOnSlot = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === slot
  )
  const stagingAreaCutout = fixturesOnSlot.find(
    fixture => fixture.name === 'stagingArea'
  )?.location

  let matchingLabware: LabwareOnDeck | null = null
  if (stagingAreaCutout != null) {
    const stagingAreaAddressableAreaName = getStagingAreaAddressableAreas([
      stagingAreaCutout,
    ] as CutoutId[])
    matchingLabware =
      Object.values(deckSetupLabware).find(
        lw =>
          getSlotInLocationStack(lw.stack) === stagingAreaAddressableAreaName[0]
      ) ?? null
  }
  const preSelectedFixture =
    createdFixtureForSlots != null && createdFixtureForSlots.length === 2
      ? ('wasteChuteAndStagingArea' as Fixture)
      : (createdFixtureForSlots[0]?.name as Fixture)

  return {
    createdModuleForSlot,
    createdAdapterForSlot,
    createdFixtureForSlots,
    preSelectedFixture,
    slotPosition: slotPosition,
    isSlotAHopper,
    isSlotAVacuumDock,
    matchingLabwareFor4thColumn: matchingLabware,
    createdStackForSlot:
      slot === 'offDeck'
        ? []
        : offDeckLabware != null
          ? [offDeckLabware.id]
          : remainingLabwareIds,
    createdLidForSlot:
      lidIdFromStack != null ? deckSetupLabware[lidIdFromStack] : undefined,
  }
}

export const formatTime = (input: string): string => {
  const timeParts = input.split(':')
  if (timeParts.length === 3) {
    const [hours, minutes, seconds] = timeParts
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':')
  } else {
    const [minutes, seconds] = timeParts
    return [
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':')
  }
}

export const _sortLabwareDropdownOptions = (
  options: DropdownOption[]
): DropdownOption[] =>
  options.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

function resolveSlotLocation(
  modules: InitialDeckSetup['modules'],
  locationStack: string[],
  robotType: RobotType
): string {
  const TCSlot =
    robotType === FLEX_ROBOT_TYPE
      ? TC_MODULE_LOCATION_OT3
      : TC_MODULE_LOCATION_OT2
  const location = getSlotInLocationStack(locationStack)
  const stackHasThermocycler = locationStack.some(
    item =>
      modules[item] != null && modules[item].type === THERMOCYCLER_MODULE_TYPE
  )
  if (stackHasThermocycler) {
    return TCSlot
  } else {
    return location
  }
}

const getLabwareInfo = (
  nicknamesById: Record<string, string>,
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame,
  labwareId: string,
  robotType: RobotType,
  t: any
): { nickName: string; latestSlot: string } => {
  const { modules } = activeDeckSetup
  const stack = activeDeckSetup.labware[labwareId]?.stack
  let latestSlot: string = ''

  // resolve the slot from the stack
  if (stack != null) {
    latestSlot = resolveSlotLocation(modules, stack, robotType)
  } else {
    console.warn(`Could not find slot for labware ${labwareId}`)
    latestSlot = 'unknown slot'
  }

  // check if it's a vacuum dock and transform to display location
  const isSlotAVacuumDock = getIsSlotAVacuumDock(latestSlot)
  if (isSlotAVacuumDock) {
    latestSlot = VACUUM_DOCK_DISPLAY_LOCATION
  }

  const name = nicknamesById[labwareId]
  let nickName: string = name
  if (latestSlot != null && latestSlot !== 'offDeck') {
    nickName = name
  } else if (latestSlot != null && latestSlot === 'offDeck') {
    nickName = t('labware_offdeck', { name })
  }
  return { nickName, latestSlot }
}

export const useLabwareDropdownOptions = (
  type: 'moveLabware' | 'labware',
  useGripper: boolean
): DropdownOption[] => {
  const { t } = useTranslation(['shared', 'protocol_steps'])
  const labwareEntities = useSelector(getLabwareEntities)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const { labware: deckSetupLabware, modules } = activeDeckSetup
  const nicknamesById = useSelector(getLabwareNicknamesById)
  const robotType = useSelector(getRobotType)
  const stackerModuleIds = Object.values(modules).filter(
    module => module.type === FLEX_STACKER_MODULE_TYPE
  )
  const labwareOptions = reduce(
    labwareEntities,
    (
      acc: DropdownOption[],
      labwareEntity: LabwareEntity,
      labwareId: string
    ): DropdownOption[] => {
      const { def } = labwareEntity
      const deckSlot = getSlotInLocationStack(
        deckSetupLabware[labwareId]?.stack
      )
      const isInaccessible = deckSlot === SYSTEM_LOCATION
      const isOffDeck = deckSlot === 'offDeck'
      const fullStackFromLabwares = getFullStackFromLabwares(
        deckSetupLabware,
        deckSlot,
        labwareId
      )
      const isTopOfStack = fullStackFromLabwares[0] === labwareId
      const topId = fullStackFromLabwares[0]
      const isOnStacker = stackerModuleIds.some(stackerModule =>
        fullStackFromLabwares.includes(stackerModule.slot)
      )
      const isLabwareLidCombo =
        (fullStackFromLabwares[1] === labwareId &&
          labwareEntities[topId]?.def.allowedRoles?.includes('lid') &&
          !def.allowedRoles?.includes('lid') &&
          !def.allowedRoles?.includes('adapter')) ??
        false
      const isLabwareInTrash =
        deckSlot === 'gripperWasteChute' ||
        MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
          deckSlot as AddressableAreaName
        ) ||
        deckSlot === 'fixedTrash'

      const isAdapter = def.allowedRoles?.includes('adapter') ?? false
      const isMovableAdapter = def.parameters.isMovableAdapter === true
      const { nickName, latestSlot } = getLabwareInfo(
        nicknamesById,
        activeDeckSetup,
        labwareId,
        robotType,
        t
      )
      const isTiprack = getIsTiprack(def)
      const isLid = getIsLid(def)
      const isFilterOffDeck =
        isOffDeck &&
        (type === 'labware' || (type === 'moveLabware' && useGripper))

      // if pipetting, ensure the labware is pipettable (not an adapter)
      const isPipetteInaccessible =
        type === 'labware' && !getIsPipettableLabware(labwareEntity.def)

      const lwIndex = fullStackFromLabwares.findIndex(
        element => element === labwareId
      )
      const elementsAboveLw = fullStackFromLabwares.slice(0, lwIndex)
      const isAdapterAbove = elementsAboveLw.some(element =>
        getIsAdapter(element, labwareEntities)
      )
      const isOnlyCollarAboveAndIsPipettable =
        elementsAboveLw.length === 1 &&
        elementsAboveLw[0] in labwareEntities &&
        getIsVacuumCollar(labwareEntities[elementsAboveLw[0]].def) &&
        getIsPipettableLabware(def)
      const isAccessibleFromTop =
        isTopOfStack || isOnlyCollarAboveAndIsPipettable

      const isPipettingToNonPipettableLabware =
        type === 'labware' && !getIsPipettableLabware(def)

      //  TODO: refactor this to be easier to read
      const shouldExclude =
        isInaccessible ||
        (type === 'labware' && isOnStacker) ||
        (isAdapter && !isMovableAdapter) ||
        isLabwareInTrash ||
        (type === 'labware' && (isTiprack || isLid)) ||
        isFilterOffDeck ||
        (type === 'moveLabware' &&
          !isTopOfStack &&
          !isMovableAdapter &&
          !isLabwareLidCombo) ||
        (type === 'labware' && !isTopOfStack) ||
        isPipetteInaccessible ||
        (type === 'labware' && !isAccessibleFromTop) ||
        (type === 'moveLabware' && isAdapterAbove) ||
        isPipettingToNonPipettableLabware
      if (shouldExclude) {
        return acc
      }
      return [
        ...acc,
        {
          name: nickName,
          value: labwareId,
          deckLabel: latestSlot,
        },
      ]
    },
    []
  )
  return _sortLabwareDropdownOptions(labwareOptions)
}

//  used for LabwareLocationField dropdown
export const getUnoccupiedStackOptions = (args: {
  robotState: RobotState
  deckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware']
  labwareIdFromDropdown: string
  labwareEntities: LabwareEntities
  t: any
}): Option[] => {
  const { robotState, deckSetupLabware, labwareIdFromDropdown, t } = args
  if (deckSetupLabware[labwareIdFromDropdown] == null) {
    return []
  }

  const { def } = deckSetupLabware[labwareIdFromDropdown]
  const labwareCompatibleParentLabware = def.compatibleParentLabware

  const { labware: labwareState } = robotState

  return Object.entries(labwareState).reduce<Option[]>(
    (acc, [labwareId, temporalLabwareOnDeck]) => {
      const slot = getSlotInLocationStack(temporalLabwareOnDeck.stack)
      const fullStack = getFullStackFromLabwares(labwareState, slot, labwareId)
      const labwareOnDeck = deckSetupLabware[labwareId]
      const isTopOfStack = fullStack[0] === labwareId
      const { def: labwareOnDeckDef } = labwareOnDeck
      const { displayName } = labwareOnDeckDef.metadata
      const { loadName: labwareOnDeckLoadName } = labwareOnDeckDef.parameters
      const isUniversalLid =
        def.parameters.loadName === 'opentrons_tough_universal_lid'
      const isLabwareOnSlotTuberack =
        labwareOnDeckDef.metadata.displayCategory === 'tubeRack'
      const isLabwareOnSlotAluminumBlock =
        labwareOnDeckDef.metadata.displayCategory === 'aluminumBlock'
      const isLabwareOnSlotTiprack = labwareOnDeckDef.parameters.isTiprack

      const allowedRoles = labwareOnDeckDef.allowedRoles ?? []
      const isLidRole = allowedRoles.includes('lid')

      const isFilterPlate =
        def.parameters.quirks?.includes('filterPlate') ?? false
      const isLabwareOnSlotFilterPlate =
        labwareOnDeckDef.parameters.quirks?.includes('filterPlate') ?? false
      const destProvidesStackingDefault =
        labwareOnDeckDef.parameters.quirks?.includes(
          'providesStackingDefault'
        ) ?? false
      const destIsVacuumSpacer = getIsVacuumSpacer(labwareOnDeckDef)
      const movingLabwareIsCollar =
        def.parameters.quirks?.includes('vacuumModuleDock') ?? false
      const isVacuumDock = slot === VACUUM_DOCK_ADDRESSABLE_AREA

      const isCompatible =
        // filter plates can go on any non-lid, non-tiprack, non-filter-plate labware
        (isFilterPlate &&
          !isLidRole &&
          !isLabwareOnSlotTiprack &&
          !isLabwareOnSlotFilterPlate) ||
        labwareCompatibleParentLabware?.includes(labwareOnDeckLoadName) ||
        // vacuum spacer: same rules as the main module area — only collars and filter plates
        (destIsVacuumSpacer && movingLabwareIsCollar) ||
        // any labware can go onto an adapter that provides a stacking default (spacers excluded above)
        (destProvidesStackingDefault && !destIsVacuumSpacer) ||
        // allow universal lid can go anywhere except for tubeRacks, aluminum blocks, and tipracks and other lids
        // since it doesn't have a labwareCompatibleLabware array, we need to special-case it, huhu
        (isUniversalLid &&
          !isLabwareOnSlotTuberack &&
          !isLabwareOnSlotAluminumBlock &&
          !isLabwareOnSlotTiprack &&
          (labwareOnDeckLoadName === 'opentrons_tough_universal_lid' ||
            !isLidRole))

      const isNotCurrentLabwareStack = !fullStack.includes(
        labwareIdFromDropdown
      )
      const isInTrash =
        slot === 'gripperWasteChute' ||
        MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(slot as AddressableAreaName) ||
        slot === 'fixedTrash'

      if (
        isTopOfStack &&
        isCompatible &&
        isNotCurrentLabwareStack &&
        !isInTrash
      ) {
        const similarLabwareStackIds = getAllLabwareIdsOfCertainURIOnStack(
          deckSetupLabware,
          labwareOnDeck
        )
        return [
          ...acc,
          {
            name:
              similarLabwareStackIds.length > 1
                ? t('protocol_steps:unoccupied_stack', {
                    name: displayName,
                  })
                : displayName,
            value: labwareId,
            deckLabel: isVacuumDock ? VACUUM_DOCK_DISPLAY_LOCATION : slot,
          },
        ]
      }
      return acc
    },
    []
  )
}
