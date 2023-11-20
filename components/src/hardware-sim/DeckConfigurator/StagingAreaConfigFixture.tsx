import * as React from 'react'
import { css } from 'styled-components'

import { Icon } from '../../icons'
import { Btn, Flex, Text } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  FIXTURE_HEIGHT,
  STAGING_AREA_DISPLAY_NAME,
  STAGING_AREA_FIXTURE_WIDTH,
} from './constants'

import type { Cutout, DeckDefinition } from '@opentrons/shared-data'

interface StagingAreaConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: Cutout
  handleClickRemove?: (fixtureLocation: Cutout) => void
}

export function StagingAreaConfigFixture(
  props: StagingAreaConfigFixtureProps
): JSX.Element {
  const { deckDefinition, handleClickRemove, fixtureLocation } = props

  const stagingAreaSlot = deckDefinition.locations.cutouts.find(
    slot => slot.id === fixtureLocation
  )
  const [xSlotPosition = 0, ySlotPosition = 0] = stagingAreaSlot?.position ?? []
  // TODO: remove adjustment when reading from fixture position
  const xAdjustment = -17
  const x = xSlotPosition + xAdjustment
  const yAdjustment = -10
  const y = ySlotPosition + yAdjustment

  return (
    <RobotCoordsForeignObject
      width={STAGING_AREA_FIXTURE_WIDTH}
      height={FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Flex css={STAGING_AREA_CONFIG_STYLE}>
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {STAGING_AREA_DISPLAY_NAME}
        </Text>
        {handleClickRemove != null ? (
          <Btn
            display={DISPLAY_FLEX}
            justifyContent={JUSTIFY_CENTER}
            onClick={() => handleClickRemove(fixtureLocation)}
          >
            <Icon name="remove" color={COLORS.white} height="2.25rem" />
          </Btn>
        ) : null}
      </Flex>
    </RobotCoordsForeignObject>
  )
}

const STAGING_AREA_CONFIG_STYLE = css`
  align-items: ${ALIGN_CENTER};
  background-color: ${COLORS.grey2};
  border-radius: ${BORDERS.borderRadiusSize1};
  color: ${COLORS.white};
  grid-gap: ${SPACING.spacing8};
  justify-content: ${JUSTIFY_CENTER};
  width: 100%;

  &:active {
    background-color: ${COLORS.darkBlack90};
  }

  &:hover {
    background-color: ${COLORS.grey1};
  }

  &:focus-visible {
    border: 3px solid ${COLORS.fundamentalsFocus};
  }
`
