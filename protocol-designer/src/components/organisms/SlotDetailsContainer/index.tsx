import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { getTopLocationInStack } from '@opentrons/step-generation'

import { getLiquidEntities } from '../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { getFullStackFromLabwaresOnDeck } from '../../../utils'
import { SlotInformation } from '../SlotInformation'

import type { DeckSlotId, RobotType } from '@opentrons/shared-data'
import type { ContentsByWell } from '../../../labware-ingred/types'

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

  const {
    modules: deckSetupModules,
    labware: deckSetupLabwares,
    additionalEquipmentOnDeck,
  } = deckSetup

  const offDeckLabwareNickName =
    offDeckLabwareId != null ? nickNames[offDeckLabwareId] : null

  const moduleOnSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )
  const fullStackFromLabwares = getFullStackFromLabwaresOnDeck(
    Object.values(deckSetupLabwares),
    slot
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
