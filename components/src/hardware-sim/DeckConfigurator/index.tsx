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
import { DeckSlotLocation } from '../DeckSlotLocation'
import { SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { EmptyFixture } from './EmptyFixture'
import { StagingAreaFixture } from './StagingAreaFixture'
import { TrashBinFixture } from './TrashBinFixture'
import { WasteChuteFixture } from './WasteChuteFixture'

import type { DeckConfiguration } from '@opentrons/shared-data'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (fixtureLocation: string) => void
  handleClickRemove: (fixtureLocation: string) => void
  lightFill?: string
  darkFill?: string
  children?: React.ReactNode
}

export function DeckConfigurator(props: DeckConfiguratorProps): JSX.Element {
  const {
    deckConfig,
    handleClickAdd,
    handleClickRemove,
    lightFill = COLORS.light1,
    darkFill = COLORS.darkGreyEnabled,
    children,
  } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  // restrict configuration to certain locations
  const configurableFixtureLocations = [
    'A1',
    'B1',
    'C1',
    'D1',
    'A3',
    'B3',
    'C3',
    'D3',
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
  const emptyFixtures = configurableDeckConfig.filter(
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
      {deckDef.locations.orderedSlots.map(slotDef => (
        <React.Fragment key={slotDef.id}>
          <DeckSlotLocation
            slotName={slotDef.id}
            deckDefinition={deckDef}
            slotClipColor={COLORS.transparent}
            slotBaseColor={lightFill}
          />
        </React.Fragment>
      ))}
      {stagingAreaFixtures.map(fixture => (
        <StagingAreaFixture
          key={fixture.fixtureId}
          handleClickRemove={handleClickRemove}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      {emptyFixtures.map(fixture => (
        <EmptyFixture
          key={fixture.fixtureId}
          handleClickAdd={handleClickAdd}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      {wasteChuteFixtures.map(fixture => (
        <WasteChuteFixture
          key={fixture.fixtureId}
          handleClickRemove={handleClickRemove}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      {trashBinFixtures.map(fixture => (
        <TrashBinFixture
          key={fixture.fixtureId}
          handleClickRemove={handleClickRemove}
          fixtureLocation={fixture.fixtureLocation}
        />
      ))}
      <SlotLabels robotType={FLEX_ROBOT_TYPE} color={darkFill} />
      {children}
    </RobotCoordinateSpace>
  )
}
