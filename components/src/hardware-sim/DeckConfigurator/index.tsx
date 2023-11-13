import * as React from 'react'

import {
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { COLORS } from '../../ui-style-constants'
import { SingleSlotFixture } from '../BaseDeck/SingleSlotFixture'
import { SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { EmptyConfigFixture } from './EmptyConfigFixture'
import { StagingAreaConfigFixture } from './StagingAreaConfigFixture'
import { TrashBinConfigFixture } from './TrashBinConfigFixture'
import { WasteChuteConfigFixture } from './WasteChuteConfigFixture'

import type {
  CutoutId,
  DeckConfiguration,
  SingleSlotCutoutFixtureId,
  WasteChuteCutoutFixtureId,
} from '@opentrons/shared-data'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (cutoutId: CutoutId) => void
  handleClickRemove: (cutoutId: CutoutId) => void
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
  const configurableFixtureLocations: CutoutId[] = [
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
    configurableFixtureLocations.includes(fixture.cutoutId)
  )

  const stagingAreaFixtures = configurableDeckConfig.filter(
    fixture => fixture.cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
  )
  const wasteChuteFixtures = configurableDeckConfig.filter(fixture =>
    WASTE_CHUTE_FIXTURES.includes(
      fixture.cutoutFixtureId as WasteChuteCutoutFixtureId
    )
  )
  const emptyFixtures = readOnly
    ? []
    : configurableDeckConfig.filter(fixture =>
        SINGLE_SLOT_FIXTURES.includes(
          fixture.cutoutFixtureId as SingleSlotCutoutFixtureId
        )
      )
  const trashBinFixtures = configurableDeckConfig.filter(
    fixture => fixture.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
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
          cutoutId={slotDef.id as CutoutId}
          deckDefinition={deckDef}
          slotClipColor={COLORS.transparent}
          fixtureBaseColor={lightFill}
          showExpansion={showExpansion}
        />
      ))}
      {stagingAreaFixtures.map(fixture => (
        <StagingAreaConfigFixture
          key={fixture.cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={fixture.cutoutId}
        />
      ))}
      {emptyFixtures.map(fixture => (
        <EmptyConfigFixture
          key={fixture.cutoutId}
          deckDefinition={deckDef}
          handleClickAdd={handleClickAdd}
          fixtureLocation={fixture.cutoutId}
        />
      ))}
      {wasteChuteFixtures.map(fixture => (
        <WasteChuteConfigFixture
          key={fixture.cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={fixture.cutoutId}
        />
      ))}
      {trashBinFixtures.map(fixture => (
        <TrashBinConfigFixture
          key={fixture.cutoutId}
          deckDefinition={deckDef}
          handleClickRemove={readOnly ? undefined : handleClickRemove}
          fixtureLocation={fixture.cutoutId}
        />
      ))}
      <SlotLabels robotType={FLEX_ROBOT_TYPE} color={darkFill} />
      {children}
    </RobotCoordinateSpace>
  )
}
