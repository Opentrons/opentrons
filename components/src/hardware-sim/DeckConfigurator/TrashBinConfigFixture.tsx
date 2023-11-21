import * as React from 'react'
import { css } from 'styled-components'

import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  FIXTURE_HEIGHT,
  SINGLE_SLOT_FIXTURE_WIDTH,
  TRASH_BIN_DISPLAY_NAME,
} from './constants'

import type { Cutout, DeckDefinition } from '@opentrons/shared-data'

interface TrashBinConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: Cutout
  handleClickRemove?: (fixtureLocation: Cutout) => void
}

export function TrashBinConfigFixture(
  props: TrashBinConfigFixtureProps
): JSX.Element {
  const { deckDefinition, handleClickRemove, fixtureLocation } = props

  const trashBinSlot = deckDefinition.locations.cutouts.find(
    slot => slot.id === fixtureLocation
  )
  const [xSlotPosition = 0, ySlotPosition = 0] = trashBinSlot?.position ?? []
  // TODO: remove adjustment when reading from fixture position
  // adjust x differently for right side/left side
  const isLeftSideofDeck =
    fixtureLocation === 'cutoutA1' ||
    fixtureLocation === 'cutoutB1' ||
    fixtureLocation === 'cutoutC1' ||
    fixtureLocation === 'cutoutD1'
  const xAdjustment = isLeftSideofDeck ? -101.5 : -17
  const x = xSlotPosition + xAdjustment
  const yAdjustment = -10
  const y = ySlotPosition + yAdjustment

  return (
    <RobotCoordsForeignObject
      width={SINGLE_SLOT_FIXTURE_WIDTH}
      height={FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Btn
        css={TRASH_BIN_CONFIG_STYLE}
        cursor={handleClickRemove != null ? 'pointer' : 'none'}
        onClick={
          handleClickRemove != null
            ? () => handleClickRemove(fixtureLocation)
            : () => {}
        }
      >
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {TRASH_BIN_DISPLAY_NAME}
        </Text>
        <Icon name="remove" color={COLORS.white} size="2rem" />
      </Btn>
    </RobotCoordsForeignObject>
  )
}

const TRASH_BIN_CONFIG_STYLE = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  background-color: ${COLORS.grey2};
  border-radius: ${BORDERS.borderRadiusSize1};
  color: ${COLORS.white};
  justify-content: ${JUSTIFY_CENTER};
  grid-gap: ${SPACING.spacing8};
  width: 100%;

  &:active {
    background-color: ${COLORS.darkBlack90};
  }

  &:hover {
    background-color: ${COLORS.grey1};
  }

  &:focus-visible {
  }
`
