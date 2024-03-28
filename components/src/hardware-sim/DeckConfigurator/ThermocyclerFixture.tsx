import * as React from 'react'
import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_1_X_ADJUSTMENT,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
  THERMOCYCLER_FIXTURE_HEIGHT,
} from './constants'

import type { CutoutFixtureId, CutoutId, DeckDefinition } from '@opentrons/shared-data'

interface ThermocyclerFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureId
  handleClickRemove?: (fixtureLocation: CutoutId, cutoutFixtureId: CutoutFixtureId) => void
}

const THERMOCYCLER_FIXTURE_DISPLAY_NAME = 'Thermocycler'

export function ThermocyclerFixture(
  props: ThermocyclerFixtureProps
): JSX.Element {
  const { deckDefinition, handleClickRemove, fixtureLocation, cutoutFixtureId } = props

  const cutoutDef = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   * the adjustment for x is different for right side/left side
   */
  const [xSlotPosition = 0, ySlotPosition = 0] = cutoutDef?.position ?? []
  const x = xSlotPosition + COLUMN_1_X_ADJUSTMENT
  const y = ySlotPosition + Y_ADJUSTMENT

  return (
    <RobotCoordsForeignObject
      width={COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH}
      height={THERMOCYCLER_FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Btn
        css={
          handleClickRemove != null
            ? CONFIG_STYLE_EDITABLE
            : CONFIG_STYLE_READ_ONLY
        }
        cursor={handleClickRemove != null ? 'pointer' : 'default'}
        onClick={
          handleClickRemove != null
            ? () => handleClickRemove(fixtureLocation, cutoutFixtureId)
            : () => {}
        }
      >
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {THERMOCYCLER_FIXTURE_DISPLAY_NAME}
        </Text>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
