import * as React from 'react'
import { css } from 'styled-components'

import { Icon } from '../../icons'
import { Btn } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, LEGACY_COLORS } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import { FIXTURE_HEIGHT, SINGLE_SLOT_FIXTURE_WIDTH } from './constants'

import type { CutoutId, DeckDefinition } from '@opentrons/shared-data'

interface EmptyConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  handleClickAdd: (fixtureLocation: CutoutId) => void
}

export function EmptyConfigFixture(
  props: EmptyConfigFixtureProps
): JSX.Element {
  const { deckDefinition, handleClickAdd, fixtureLocation } = props

  const standardSlotCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   * the adjustment for x is different for right side/left side
   */
  const [xSlotPosition = 0, ySlotPosition = 0] =
    standardSlotCutout?.position ?? []

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
        css={EMPTY_CONFIG_STYLE}
        onClick={() => handleClickAdd(fixtureLocation)}
      >
        <Icon name="add" color={LEGACY_COLORS.blueEnabled} size="2rem" />
      </Btn>
    </RobotCoordsForeignObject>
  )
}

const EMPTY_CONFIG_STYLE = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  background-color: ${LEGACY_COLORS.mediumBlueEnabled};
  border: 3px dashed ${LEGACY_COLORS.blueEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  width: 100%;

  &:active {
    border: 3px solid ${LEGACY_COLORS.blueEnabled};
    background-color: ${LEGACY_COLORS.mediumBluePressed};
  }

  &:focus {
    border: 3px solid ${LEGACY_COLORS.blueEnabled};
    background-color: ${LEGACY_COLORS.mediumBluePressed};
  }

  &:hover {
    background-color: ${LEGACY_COLORS.mediumBluePressed};
  }

  &:focus-visible {
    border: 3px solid ${COLORS.blue50};
  }
`
