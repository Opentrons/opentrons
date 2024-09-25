import { Fragment } from 'react'
import {
  COLORS,
  FlexTrash,
  SingleSlotFixture,
  StagingAreaFixture,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import { lightFill } from './DeckSetupContainer'
import type { TrashCutoutId, StagingAreaLocation } from '@opentrons/components'
import type {
  CutoutId,
  DeckDefinition,
  RobotType,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import type { Fixture } from './constants'

interface FixtureRenderProps {
  fixture: Fixture
  cutout: CutoutId
  robotType: RobotType
  deckDef: DeckDefinition
}
export const FixtureRender = (props: FixtureRenderProps): JSX.Element => {
  const { fixture, cutout, deckDef, robotType } = props

  switch (fixture) {
    case 'stagingArea': {
      return (
        <StagingAreaFixture
          key={`fixtureRender_${fixture}`}
          cutoutId={cutout as StagingAreaLocation}
          deckDefinition={deckDef}
          fixtureBaseColor={lightFill}
        />
      )
    }
    case 'trashBin': {
      return (
        <Fragment key={`fixtureRender_${fixture}`}>
          <SingleSlotFixture
            cutoutId={cutout}
            deckDefinition={deckDef}
            slotClipColor={COLORS.transparent}
            fixtureBaseColor={lightFill}
          />
          <FlexTrash
            robotType={robotType}
            trashIconColor={lightFill}
            trashCutoutId={cutout as TrashCutoutId}
            backgroundColor={COLORS.grey50}
          />
        </Fragment>
      )
    }
    case 'wasteChute': {
      return (
        <WasteChuteFixture
          key={`fixtureRender_${fixture}`}
          cutoutId={cutout as typeof WASTE_CHUTE_CUTOUT}
          deckDefinition={deckDef}
          fixtureBaseColor={lightFill}
        />
      )
    }
    case 'wasteChuteAndStagingArea': {
      return (
        <WasteChuteStagingAreaFixture
          key={`fixtureRender_${fixture}`}
          cutoutId={cutout as typeof WASTE_CHUTE_CUTOUT}
          deckDefinition={deckDef}
          fixtureBaseColor={lightFill}
        />
      )
    }
  }
}
