import * as React from 'react'
import { css } from 'styled-components'

import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, LEGACY_COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  WASTE_CHUTE_DISPLAY_NAME,
  FIXTURE_HEIGHT,
  STAGING_AREA_FIXTURE_WIDTH,
  SINGLE_SLOT_FIXTURE_WIDTH,
} from './constants'

import type { CutoutId, DeckDefinition } from '@opentrons/shared-data'

interface WasteChuteConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  handleClickRemove?: (fixtureLocation: CutoutId) => void
  hasStagingAreas?: boolean
}

export function WasteChuteConfigFixture(
  props: WasteChuteConfigFixtureProps
): JSX.Element {
  const {
    deckDefinition,
    handleClickRemove,
    fixtureLocation,
    hasStagingAreas = false,
  } = props

  const wasteChuteCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   */
  const [xSlotPosition = 0, ySlotPosition = 0] =
    wasteChuteCutout?.position ?? []

  const xAdjustment = -17
  const x = xSlotPosition + xAdjustment
  const yAdjustment = -10
  const y = ySlotPosition + yAdjustment

  return (
    <RobotCoordsForeignObject
      width={
        hasStagingAreas ? STAGING_AREA_FIXTURE_WIDTH : SINGLE_SLOT_FIXTURE_WIDTH
      }
      height={FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Btn
        css={
          handleClickRemove != null
            ? WASTE_CHUTE_CONFIG_STYLE_EDITABLE
            : WASTE_CHUTE_CONFIG_STYLE_READ_ONLY
        }
        cursor={handleClickRemove != null ? 'pointer' : 'default'}
        onClick={
          handleClickRemove != null
            ? () => handleClickRemove(fixtureLocation)
            : () => {}
        }
      >
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {WASTE_CHUTE_DISPLAY_NAME}
        </Text>
        {handleClickRemove != null ? (
          <Icon name="remove" color={LEGACY_COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}

const WASTE_CHUTE_CONFIG_STYLE_READ_ONLY = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  background-color: ${LEGACY_COLORS.grey2};
  border-radius: ${BORDERS.borderRadiusSize1};
  color: ${LEGACY_COLORS.white};
  justify-content: ${JUSTIFY_CENTER};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
`

const WASTE_CHUTE_CONFIG_STYLE_EDITABLE = css`
  ${WASTE_CHUTE_CONFIG_STYLE_READ_ONLY}

  &:active {
    background-color: ${LEGACY_COLORS.darkBlack90};
  }

  &:hover {
    background-color: ${LEGACY_COLORS.grey1};
  }

  &:focus-visible {
    border: 3px solid ${LEGACY_COLORS.fundamentalsFocus};
  }
`
