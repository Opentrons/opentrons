import * as React from 'react'

import {
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { COLORS } from '../../ui-style-constants'
import { DeckSlotLocation } from '../DeckSlotLocation'
import { FlexTrash, SlotLabels } from '../Deck'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { EmptyFixture } from './EmptyFixture'
import { StagingAreaFixture } from './StagingAreaFixture'
import { WasteChuteFixture } from './WasteChuteFixture'

import type { DeckConfiguration, DeckSlot } from '@opentrons/shared-data'

interface DeckConfiguratorProps {
  deckConfig: DeckConfiguration
  handleClickAdd: (fixtureLocation: string) => void
  handleClickRemove: (fixtureLocation: string) => void
  lightFill?: string
  darkFill?: string
  trashSlotName?: DeckSlot['id']
  children?: React.ReactNode
}

export function DeckConfigurator(props: DeckConfiguratorProps): JSX.Element {
  const {
    deckConfig,
    handleClickAdd,
    handleClickRemove,
    trashSlotName = 'A3',
    lightFill = COLORS.light1,
    darkFill = COLORS.darkGreyEnabled,
    children,
  } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  // restrict configuration to certain locations
  const configurableFixtureLocations = ['B3', 'C3', 'D3']
  const configurableDeckConfig = deckConfig.filter(fixture =>
    configurableFixtureLocations.includes(fixture.fixtureLocation)
  )

  const stagingAreaFixtures = configurableDeckConfig.filter(
    fixture => fixture.loadName === 'extensionSlot'
  )
  const wasteChuteFixtures = configurableDeckConfig.filter(
    fixture => fixture.loadName === 'trashChute'
  )
  const emptyFixtures = configurableDeckConfig.filter(
    fixture => fixture.loadName === 'standardSlot'
  )

  return (
    <RobotCoordinateSpace
      height="400px"
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {deckDef.locations.orderedSlots.map(slotDef => (
        <>
          <DeckSlotLocation
            slotName={slotDef.id}
            deckDefinition={deckDef}
            slotClipColor={COLORS.transparent}
            slotBaseColor={lightFill}
          />
          {slotDef.id === trashSlotName ? (
            <FlexTrash
              robotType={FLEX_ROBOT_TYPE}
              trashIconColor={lightFill}
              backgroundColor={darkFill}
            />
          ) : null}
        </>
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
      <SlotLabels robotType={FLEX_ROBOT_TYPE} color={darkFill} />
      {children}
    </RobotCoordinateSpace>
  )
}
