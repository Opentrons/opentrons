import * as React from 'react'
import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_3_X_ADJUSTMENT,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  FIXTURE_HEIGHT,
  COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
  CONFIG_STYLE_SELECTED,
} from './constants'

import type {
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface AbsorbanceReaderFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureId
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  selected?: boolean
}

const ABSORBANCE_READER_FIXTURE_DISPLAY_NAME = 'Absorbance Reader'

export function AbsorbanceReaderFixture(
  props: AbsorbanceReaderFixtureProps
): JSX.Element {
  const {
    deckDefinition,
    handleClickRemove,
    fixtureLocation,
    cutoutFixtureId,
    selected = false,
  } = props

  const cutoutDef = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   * the adjustment for x is different for right side/left side
   */
  // TODO (AA): fix the slot length for the absorbance reader fixture
  const [xSlotPosition = 0, ySlotPosition = 0] = cutoutDef?.position ?? []

  const x = xSlotPosition + COLUMN_3_X_ADJUSTMENT

  const y = ySlotPosition + Y_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
  return (
    <RobotCoordsForeignObject
      width={COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH}
      height={FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Btn
        css={handleClickRemove != null ? editableStyle : CONFIG_STYLE_READ_ONLY}
        cursor={handleClickRemove != null ? 'pointer' : 'default'}
        onClick={
          handleClickRemove != null
            ? () => {
                handleClickRemove(fixtureLocation, cutoutFixtureId)
              }
            : () => {}
        }
      >
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {ABSORBANCE_READER_FIXTURE_DISPLAY_NAME}
        </Text>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
