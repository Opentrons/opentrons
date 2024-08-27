import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { FLEX_ROBOT_TYPE, getModuleDisplayName } from '@opentrons/shared-data'
import { RobotCoordsForeignObject } from '@opentrons/components'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { selectors } from '../../labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { SlotInformation } from '../../organisms/SlotInformation'
import { getYPosition } from './utils'

import type { DeckSlotId, RobotType } from '@opentrons/shared-data'

interface SlotDetailContainerProps {
  robotType: RobotType
  slot: DeckSlotId | null
}

export function SlotDetailsContainer(
  props: SlotDetailContainerProps
): JSX.Element | null {
  const { robotType, slot } = props
  const { t } = useTranslation('shared')
  const location = useLocation()
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const allIngredNamesIds = useSelector(selectors.allIngredientNamesIds)

  if (slot == null) {
    return null
  }
  const {
    modules: deckSetupModules,
    labware: deckSetupLabwares,
    additionalEquipmentOnDeck,
  } = deckSetup

  const moduleOnSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )
  const labwareOnSlot = Object.values(deckSetupLabwares).find(
    lw => lw.slot === slot || lw.slot === moduleOnSlot?.id
  )
  const nestedLabwareOnSlot = Object.values(deckSetupLabwares).find(lw =>
    Object.keys(deckSetupLabwares).includes(lw.slot)
  )
  const labwareOnSlotDisplayName = labwareOnSlot?.def.metadata.displayName
  const nestedLabwareOnSlotDisplayName =
    nestedLabwareOnSlot?.def.metadata.displayName

  const fixturesOnSlot = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === slot
  )
  const fixtureDisplayNames: string[] = fixturesOnSlot.map(fixture =>
    t(`${fixture.name}`)
  )
  const moduleDisplayName =
    moduleOnSlot != null ? getModuleDisplayName(moduleOnSlot.model) : null

  const liquidsLabware =
    nestedLabwareOnSlot != null ? nestedLabwareOnSlot : labwareOnSlot
  const wellContents =
    allWellContentsForActiveItem && liquidsLabware != null
      ? allWellContentsForActiveItem[liquidsLabware.id]
      : null

  const liquids =
    wellContents != null
      ? Object.values(wellContents).flatMap(content => content.groupIds)
      : null

  const uniqueLiquids = Array.from(new Set(liquids))

  const liquidNamesOnLabware = uniqueLiquids
    .map(liquid => {
      const foundLiquid = Object.values(allIngredNamesIds).find(
        id => id.ingredientId === liquid
      )
      return foundLiquid?.name ?? ''
    })
    .filter(Boolean)

  const labwares: string[] = []
  if (labwareOnSlotDisplayName != null) {
    labwares.push(labwareOnSlotDisplayName)
  }
  if (nestedLabwareOnSlotDisplayName != null) {
    labwares.push(nestedLabwareOnSlotDisplayName)
  }

  return location.pathname === '/designer' ? (
    <RobotCoordsForeignObject
      width="15.8125rem"
      height="26.75rem"
      x={robotType === FLEX_ROBOT_TYPE ? '-400' : '-300'}
      y={getYPosition({ robotType, slot })}
    >
      <SlotInformation
        location={slot}
        robotType={robotType}
        modules={moduleDisplayName != null ? [moduleDisplayName] : []}
        labwares={labwares}
        fixtures={fixtureDisplayNames}
        liquids={liquidNamesOnLabware}
      />
    </RobotCoordsForeignObject>
  ) : (
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
