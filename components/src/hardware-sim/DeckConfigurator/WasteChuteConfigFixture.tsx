import * as React from 'react'

import { Icon } from '../../icons'
import { Btn, Flex, Text } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'

import type { Cutout, DeckDefinitionV4 } from '@opentrons/shared-data'

// TODO: replace stubs with JSON definitions when available
const wasteChuteDef = {
  schemaVersion: 1,
  version: 1,
  namespace: 'opentrons',
  metadata: {
    displayName: 'Waste chute',
  },
  parameters: {
    loadName: 'trash_chute',
  },
  boundingBox: {
    xDimension: 286.5,
    yDimension: 106.0,
    zDimension: 0,
  },
}

interface WasteChuteConfigFixtureProps {
  deckDefinition: DeckDefinitionV4
  fixtureLocation: Cutout
  handleClickRemove?: (fixtureLocation: Cutout) => void
}

export function WasteChuteConfigFixture(
  props: WasteChuteConfigFixtureProps
): JSX.Element {
  const { deckDefinition, handleClickRemove, fixtureLocation } = props

  const wasteChuteSlot = deckDefinition.locations.cutouts.find(
    slot => slot.id === fixtureLocation
  )
  const [xSlotPosition = 0, ySlotPosition = 0] = wasteChuteSlot?.position ?? []
  // TODO: remove adjustment when reading from fixture position
  const xAdjustment = -17
  const x = xSlotPosition + xAdjustment
  const yAdjustment = -10
  const y = ySlotPosition + yAdjustment

  const { xDimension, yDimension } = wasteChuteDef.boundingBox

  return (
    <RobotCoordsForeignObject
      width={xDimension}
      height={yDimension}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={COLORS.grey2}
        borderRadius={BORDERS.radiusSoftCorners}
        color={COLORS.white}
        gridGap={SPACING.spacing8}
        justifyContent={JUSTIFY_CENTER}
        width="100%"
      >
        <Text css={TYPOGRAPHY.bodyTextSemiBold}>
          {wasteChuteDef.metadata.displayName}
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
