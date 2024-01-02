import * as React from 'react'
import { css } from 'styled-components'

import { Icon } from '../../icons'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  WASTE_CHUTE_DISPLAY_NAME,
  FIXTURE_HEIGHT,
  STAGING_AREA_FIXTURE_WIDTH,
  SINGLE_SLOT_FIXTURE_WIDTH,
} from './constants'

import type { Cutout, DeckDefinition } from '@opentrons/shared-data'

interface WasteChuteConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: Cutout
  handleClickRemove?: (fixtureLocation: Cutout) => void
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

  const wasteChuteSlot = deckDefinition.locations.cutouts.find(
    slot => slot.id === fixtureLocation
  )
  const [xSlotPosition = 0, ySlotPosition = 0] = wasteChuteSlot?.position ?? []
  // TODO: remove adjustment when reading from fixture position
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
      <button
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
        <p css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {WASTE_CHUTE_DISPLAY_NAME}
        </p>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </button>
    </RobotCoordsForeignObject>
  )
}

const WASTE_CHUTE_CONFIG_STYLE_READ_ONLY = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  background-color: ${COLORS.grey2};
  border-radius: ${BORDERS.borderRadiusSize1};
  color: ${COLORS.white};
  justify-content: ${JUSTIFY_CENTER};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
`

const WASTE_CHUTE_CONFIG_STYLE_EDITABLE = css`
  ${WASTE_CHUTE_CONFIG_STYLE_READ_ONLY}

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
