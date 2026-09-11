import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  FLEX_STACKER_MODULE_TYPE,
  getModuleDisplayName,
  VACUUM_MODULE_A3_ADDRESSABLE_AREA,
} from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
  getTopLocationInStack,
} from '@opentrons/step-generation'

import { VACUUM_MODULE_SLOT } from '/protocol-designer/constants'
import { getLiquidEntities } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { selectors as uiLabwareSelectors } from '/protocol-designer/ui/labware'
import { getFullStackFromLabwaresOnDeck } from '/protocol-designer/utils'

import { SlotInformation } from '../SlotInformation'

import type { DeckSlotId, RobotType } from '@opentrons/shared-data'
import type { HopperLocationMapKey } from '@opentrons/step-generation'
import type { ContentsByWell } from '/protocol-designer/labware-ingred/types'

interface SlotDetailContainerProps {
  robotType: RobotType
  slot: DeckSlotId | null
  offDeckLabwareId?: string | null
}

export function SlotDetailsContainer(
  props: SlotDetailContainerProps
): JSX.Element | null {
  const { robotType, slot, offDeckLabwareId } = props
  const { t } = useTranslation('shared')
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const nickNames = useSelector(uiLabwareSelectors.getLabwareNicknamesById)
  const liquidEntities = useSelector(getLiquidEntities)
  if (slot == null || (slot === 'offDeck' && offDeckLabwareId == null)) {
    return null
  }
  const isSlotAHopper = getIsSlotAHopper(slot)
  const isSlotAVacuumDock = getIsSlotAVacuumDock(slot)
  const isVacuumModuleMainArea = slot === VACUUM_MODULE_A3_ADDRESSABLE_AREA
  let adjustedSlotToFindModule = slot
  if (isSlotAHopper) {
    adjustedSlotToFindModule =
      FAKE_HOPPER_LOCATION_MAP[slot as HopperLocationMapKey]
  } else if (isSlotAVacuumDock || isVacuumModuleMainArea) {
    adjustedSlotToFindModule = VACUUM_MODULE_SLOT
  }

  const {
    modules: deckSetupModules,
    labware: deckSetupLabwares,
    additionalEquipmentOnDeck,
  } = deckSetup
  const stackerModuleState = Object.values(deckSetupModules).find(
    module =>
      module.type === FLEX_STACKER_MODULE_TYPE &&
      module.slot === adjustedSlotToFindModule
  )?.moduleState

  const labwareInHopper =
    stackerModuleState != null && 'labwareInHopper' in stackerModuleState
      ? stackerModuleState.labwareInHopper
      : null
  const offDeckLabwareNickName =
    offDeckLabwareId != null ? nickNames[offDeckLabwareId] : null

  const moduleOnSlot = Object.values(deckSetupModules).find(
    module => module.slot === adjustedSlotToFindModule
  )
  const fullStackFromLabwares = getFullStackFromLabwaresOnDeck(
    Object.values(deckSetupLabwares),
    // need to special case this for now, since the main vacuum addressable area maps to slot A3 for stack logic
    // this will not be necessary once addressable areas are the source of truth in an upcoming large-scale refactor
    isVacuumModuleMainArea ? VACUUM_MODULE_SLOT : slot,
    isSlotAHopper,
    isSlotAVacuumDock
  )
  const topLocationLabwareId =
    fullStackFromLabwares?.length > 0
      ? getTopLocationInStack(fullStackFromLabwares)
      : null
  const fixturesOnSlot = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === slot
  )
  const fixtureDisplayNames: string[] = fixturesOnSlot.map(fixture =>
    t(`${fixture.name}`)
  )
  const moduleDisplayName =
    moduleOnSlot != null ? getModuleDisplayName(moduleOnSlot.model) : null

  let wellContents: ContentsByWell | null = null
  if (offDeckLabwareId != null && allWellContentsForActiveItem != null) {
    wellContents = allWellContentsForActiveItem[offDeckLabwareId]
  } else if (
    allWellContentsForActiveItem != null &&
    topLocationLabwareId != null
  ) {
    wellContents = allWellContentsForActiveItem[topLocationLabwareId]
  }

  const liquids =
    wellContents != null
      ? Object.values(wellContents).flatMap(content => content.groupIds)
      : null

  const uniqueLiquids = Array.from(new Set(liquids))

  const liquidNamesOnLabware = uniqueLiquids
    .map(liquid => {
      const foundLiquid = Object.values(liquidEntities).find(
        id => id.liquidGroupId === liquid
      )
      return foundLiquid?.displayName ?? ''
    })
    .filter(Boolean)

  const labwares: string[] = []
  if (offDeckLabwareNickName != null) {
    labwares.push(offDeckLabwareNickName)
  } else if (labwareInHopper != null && isSlotAHopper) {
    const labwareIds: string[] = labwareInHopper.flatMap(
      ({ primaryLabwareId, adapterLabwareId, lidLabwareId }) =>
        [primaryLabwareId, adapterLabwareId, lidLabwareId].filter(
          (id): id is string => id != null
        )
    )
    labwareIds.forEach(id => {
      labwares.push(deckSetupLabwares[id].def.metadata.displayName)
    })
  } else if (isSlotAVacuumDock && fullStackFromLabwares?.length > 0) {
    // For vacuum dock, show all labware in the stack
    fullStackFromLabwares.forEach(id => {
      if (deckSetupLabwares[id] != null) {
        labwares.push(nickNames[id])
      }
    })
  } else if (fullStackFromLabwares?.length > 0) {
    fullStackFromLabwares.forEach(id => {
      if (deckSetupLabwares[id] != null) {
        labwares.push(nickNames[id])
      }
    })
  }
  return (
    <SlotInformation
      location={slot}
      robotType={robotType}
      modules={moduleDisplayName != null ? [moduleDisplayName] : []}
      labwares={labwares}
      fixtures={fixtureDisplayNames}
      liquids={liquidNamesOnLabware}
    />
  )
}
