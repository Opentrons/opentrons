import * as React from 'react'

import { Icon } from '../../icons'
import { Btn, Flex, Text } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'

import type { Cutout, DeckDefinitionV4 } from '@opentrons/shared-data'

// TODO: replace stubs with JSON definitions when available
const trashBinDef = {
  schemaVersion: 1,
  version: 1,
  namespace: 'opentrons',
  metadata: {
    displayName: 'Trash bin',
  },
  parameters: {
    loadName: 'trash_bin',
  },
  boundingBox: {
    xDimension: 246.5,
    yDimension: 106.0,
    zDimension: 0,
  },
}

interface TrashBinConfigFixtureProps {
  deckDefinition: DeckDefinitionV4
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

  const { xDimension, yDimension } = trashBinDef.boundingBox

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
          {trashBinDef.metadata.displayName}
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
