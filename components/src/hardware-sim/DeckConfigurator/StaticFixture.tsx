import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  CONFIG_STYLE_READ_ONLY,
  FIXTURE_HEIGHT,
  COLUMN_2_SINGLE_SLOT_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
  COLUMN_2_X_ADJUSTMENT,
} from './constants'

import type { CutoutId, DeckDefinition } from '@opentrons/shared-data'

interface StaticFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  label: string
}

/**
 * this component allows us to add static labeled fixtures to the center column of a deck
 * config map
 */

export function StaticFixture(props: StaticFixtureProps): JSX.Element {
  const { deckDefinition, fixtureLocation, label } = props

  const staticCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   */
  const [xSlotPosition = 0, ySlotPosition = 0] = staticCutout?.position ?? []
  const y = ySlotPosition + Y_ADJUSTMENT
  const x = xSlotPosition + COLUMN_2_X_ADJUSTMENT

  return (
    <RobotCoordsForeignObject
      width={COLUMN_2_SINGLE_SLOT_FIXTURE_WIDTH}
      height={FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Btn css={CONFIG_STYLE_READ_ONLY} cursor={'default'} onClick={() => {}}>
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>{label}</Text>
      </Btn>
    </RobotCoordsForeignObject>
  )
}
