import * as React from 'react'

import {
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { COLORS } from '../../ui-style-constants'
import { SingleSlotFixture } from '../BaseDeck/SingleSlotFixture'
import { SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { EmptyConfigFixture } from './EmptyConfigFixture'
import { StagingAreaConfigFixture } from './StagingAreaConfigFixture'
import { TrashBinConfigFixture } from './TrashBinConfigFixture'
import { WasteChuteConfigFixture } from './WasteChuteConfigFixture'

import type { Cutout, DeckConfiguration } from '@opentrons/shared-data'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (fixtureLocation: Cutout) => void
  handleClickRemove: (fixtureLocation: Cutout) => void
  lightFill?: string
  darkFill?: string
  readOnly?: boolean
  showExpansion?: boolean
  children?: React.ReactNode
}

export function DeckConfigurator(props: DeckConfiguratorProps): JSX.Element {
  const {
    deckConfig,
    handleClickAdd,
    handleClickRemove,
    lightFill = COLORS.light1,
    darkFill = COLORS.darkGreyEnabled,
    readOnly = false,
    showExpansion = true,
    children,
  } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  // restrict configuration to certain locations
  const configurableFixtureLocations: Cutout[] = [
    'cutoutA1',
    'cutoutB1',
    'cutoutC1',
    'cutoutD1',
    'cutoutA3',
    'cutoutB3',
    'cutoutC3',
    'cutoutD3',
  ]
  const configurableDeckConfig = deckConfig.filter(fixture =>
    configurableFixtureLocations.includes(fixture.fixtureLocation)
  )

  const stagingAreaFixtures = configurableDeckConfig.filter(
    fixture => fixture.loadName === STAGING_AREA_LOAD_NAME
  )
  const wasteChuteFixtures = configurableDeckConfig.filter(
    fixture => fixture.loadName === WASTE_CHUTE_LOAD_NAME
  )
  const emptyFixtures = readOnly
    ? []
    : configurableDeckConfig.filter(
        fixture => fixture.loadName === STANDARD_SLOT_LOAD_NAME
      )
  const trashBinFixtures = configurableDeckConfig.filter(
    fixture => fixture.loadName === TRASH_BIN_LOAD_NAME
  )

  return (
    <RobotCoordinateSpace
      height="400px"
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {/* TODO(bh, 2023-10-18): migrate to v4 deck def cutouts */}
      {deckDef.locations.cutouts.map(slotDef => (
        <SingleSlotFixture
          key={slotDef.id}
          cutoutId={slotDef.id as Cutout}
          deckDefinition={deckDef}
          slotClipColor={COLORS.transparent}
          fixtureBaseColor={lightFill}
          showExpansion={showExpansion}
        />
      ))}
      {stagingAreaFixtures.map(fixture => (
        <StagingAreaConfigFixture
          key={fixture.fixtureId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      {emptyFixtures.map(fixture => (
        <EmptyConfigFixture
          key={fixture.fixtureId}
          deckDefinition={deckDef}
          handleClickAdd={handleClickAdd}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      {wasteChuteFixtures.map(fixture => (
        <WasteChuteConfigFixture
          key={fixture.fixtureId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      {trashBinFixtures.map(fixture => (
        <TrashBinConfigFixture
          key={fixture.fixtureId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      <SlotLabels robotType={FLEX_ROBOT_TYPE} color={darkFill} />
      {children}
    </RobotCoordinateSpace>
  )
}
