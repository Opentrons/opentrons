import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { reduce } from 'lodash'

import {
  FLEX_ROBOT_TYPE,
  getIsTiprack,
  getPositionFromSlotId,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getRobotType } from '../../file-data/selectors'
import { getLabwareEntities } from '../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { getLabwareNicknamesById } from '../../ui/labware/selectors'
import {
  getFullStackFromLabwaresOnDeck,
  getStagingAreaAddressableAreas,
} from '../../utils'

import type { DropdownOption } from '@opentrons/components'
import type {
  CoordinateTuple,
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentName,
  DeckSlot,
  LabwareEntity,
} from '@opentrons/step-generation'
import type {
  AllTemporalPropertiesForTimelineFrame,
  InitialDeckSetup,
  LabwareOnDeck,
  ModuleOnDeck,
} from '../../step-forms'
import type { Fixture } from './DeckSetup/constants'

export const TIPRACK_LID_LOADNAME = 'opentrons_flex_tiprack_lid'
export const TC_LID_LOADNAME = 'opentrons_tough_pcr_auto_sealing_lid'
export const LID_LOADNAMES = [TIPRACK_LID_LOADNAME, TC_LID_LOADNAME]

export interface AdditionalEquipment {
  name: AdditionalEquipmentName
  id: string
  location?: string
}

interface SlotInformation {
  createdStackForSlot: string[]
  matchingLabwareFor4thColumn: LabwareOnDeck | null
  slotPosition: CoordinateTuple | null
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
}

const FOURTH_COLUMN_SLOTS = ['A4', 'B4', 'C4', 'D4']
const FOURTH_COLUMN_CONVERSION = { A4: 'A3', B4: 'B3', C4: 'C3', D4: 'D3' }

export const getSlotInformation = (
  props: SlotInformationProps
): SlotInformation => {
  const { slot, deckSetup, deckDef } = props
  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup
  const offDeckLabware = deckSetupLabware[slot]
  const slotPosition =
    deckDef != null && offDeckLabware == null
      ? getPositionFromSlotId(slot, deckDef) ?? null
      : null
  const createdModuleForSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )

  const fullStackFromLabwares = getFullStackFromLabwaresOnDeck(
    Object.values(deckSetupLabware),
    slot
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
        deckSetupLabware[id].def.parameters.loadName === TC_LID_LOADNAME
    )?.length ?? 0

  const labwareIdsFromFullStack =
    fullStackFromLabwares?.filter(
      id =>
        deckSetupLabware[id] != null &&
        //  remove lid from stack if its a labware + lid
        (numOfTcLidsOnStack === 1 && labwareStackOnSlot.length > 1
          ? !LID_LOADNAMES.includes(
              deckSetupLabware[id].def.parameters.loadName
            )
          : //  otherwise, count lid in stack if its a stack of lids
            deckSetupLabware[id].def.parameters.loadName !==
            TIPRACK_LID_LOADNAME)
    ) ?? []

  const lidIdFromStack = fullStackFromLabwares?.find(id =>
    numOfTcLidsOnStack === 1
      ? LID_LOADNAMES.includes(deckSetupLabware[id].def.parameters.loadName)
      : deckSetupLabware[id]?.def.parameters.loadName === TIPRACK_LID_LOADNAME
  )

  const bottomMostLabware =
    deckSetupLabware[
      labwareIdsFromFullStack[labwareIdsFromFullStack.length - 1]
    ]
  const createdAdapterForSlot =
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

const getNickname = (
  nicknamesById: Record<string, string>,
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame,
  labwareId: string,
  robotType: RobotType,
  t: any
): string => {
  const { modules } = activeDeckSetup
  const stack = activeDeckSetup.labware[labwareId].stack
  const latestSlot = resolveSlotLocation(modules, stack, robotType)
  const name = nicknamesById[labwareId]
  let nickName: string = name
  if (latestSlot != null && latestSlot !== 'offDeck') {
    nickName = t('labware_in_slot', { name, slot: latestSlot })
  } else if (latestSlot != null && latestSlot === 'offDeck') {
    nickName = t('labware_offdeck', { name })
  }
  return nickName
}

export const useLabwareDropdownOptions = (
  type: 'moveLabware' | 'labware',
  useGripper: boolean
): DropdownOption[] => {
  const { t } = useTranslation('shared')
  const labwareEntities = useSelector(getLabwareEntities)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const nicknamesById = useSelector(getLabwareNicknamesById)
  const robotType = useSelector(getRobotType)
  const moveLabwareOptions = reduce(
    labwareEntities,
    (
      acc: DropdownOption[],
      labwareEntity: LabwareEntity,
      labwareId: string
    ): DropdownOption[] => {
      const deckSlot = getSlotInLocationStack(
        activeDeckSetup.labware[labwareId].stack
      )
      const isLabwareInWasteChute = deckSlot === 'gripperWasteChute'

      const isAdapter =
        labwareEntity.def.allowedRoles?.includes('adapter') ?? false
      const nickName = getNickname(
        nicknamesById,
        activeDeckSetup,
        labwareId,
        robotType,
        t
      )
      const isTiprack = getIsTiprack(labwareEntity.def)
      const isFilterOffDeck =
        deckSlot === 'offDeck' &&
        (type === 'labware' || (type === 'moveLabware' && useGripper))

      //  filter out moving adapters, and labware in
      //  waste chute for moveLabware, labware off-deck and
      //  labware that is a tiprack for the labware dropdown only
      return isAdapter ||
        isLabwareInWasteChute ||
        (type === 'labware' && isTiprack) ||
        isFilterOffDeck
        ? acc
        : [
            ...acc,
            {
              name: nickName,
              value: labwareId,
            },
          ]
    },
    []
  )
  return _sortLabwareDropdownOptions(moveLabwareOptions)
}
