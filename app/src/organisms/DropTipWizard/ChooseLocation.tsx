import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  RESPONSIVENESS,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  useDeckLocationSelect,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getPositionFromSlotId,
} from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
// import { NeedHelpLink } from '../CalibrationPanels'
import { TwoUpTileLayout } from '../LabwarePositionCheck/TwoUpTileLayout'

import type { CommandData } from '@opentrons/api-client'
import type { RobotType } from '@opentrons/shared-data'

// TODO: get help link article URL
// const NEED_HELP_URL = ''

interface ChooseLocationProps {
  handleProceed: () => void
  title: string
  body: string | JSX.Element
  robotType: RobotType
  moveToXYCoordinate: (x: number, y: number) => Promise<CommandData[] | null>
  isRobotMoving: boolean
  isOnDevice: boolean
  setErrorMessage: (arg0: string) => void
}

export const ChooseLocation = (
  props: ChooseLocationProps
): JSX.Element | null => {
  const {
    handleProceed,
    title,
    body,
    robotType,
    moveToXYCoordinate,
    isRobotMoving,
    isOnDevice,
    setErrorMessage,
  } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const deckDef = getDeckDefFromRobotType(robotType)
  const { DeckLocationSelect, selectedLocation } = useDeckLocationSelect(
    robotType
  )

  const handleConfirmPosition: React.MouseEventHandler = () => {
    const deckSlot = deckDef.locations.addressableAreas.find(
      l => l.id === selectedLocation.slotName
    )

    const slotPosition = getPositionFromSlotId(
      selectedLocation.slotName,
      deckDef
    )

    const slotX = slotPosition?.[0]
    const slotY = slotPosition?.[1]
    const xDimension = deckSlot?.boundingBox.xDimension
    const yDimension = deckSlot?.boundingBox.yDimension
    if (
      slotX != null &&
      slotY != null &&
      xDimension != null &&
      yDimension != null
    ) {
      const targetX = slotX + xDimension / 2
      const targetY = slotY + yDimension / 2
      moveToXYCoordinate(targetX, targetY)
        .then(() => handleProceed())
        .catch(e => setErrorMessage(`${e.message}`))
    }
  }

  if (isRobotMoving) {
    return <InProgressModal description={t('stand_back_exiting')} />
  }

  if (isOnDevice) {
    return (
      <Flex
        padding={SPACING.spacing32}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flex="1"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing24}
          flex="1"
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            width="100%"
            flex="1"
          >
            <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {title}
            </StyledText>
            <StyledText as="p">{body}</StyledText>
          </Flex>
          <Flex
            flex="1"
            justifyContent={JUSTIFY_CENTER}
            paddingLeft={SPACING.spacing24}
          >
            {DeckLocationSelect}
          </Flex>
        </Flex>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <SmallButton
            buttonText={i18n.format(t('move_to_slot'), 'capitalize')}
            onClick={handleConfirmPosition}
          />
        </Flex>
      </Flex>
    )
  } else {
    return (
      <Flex css={TILE_CONTAINER_STYLE}>
        <TwoUpTileLayout
          title={title}
          body={body}
          rightElement={DeckLocationSelect}
          footer={
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_FLEX_END}
            >
              {/* <NeedHelpLink href={NEED_HELP_URL} /> */}
              <PrimaryButton onClick={handleConfirmPosition}>
                {i18n.format(t('move_to_slot'), 'capitalize')}
              </PrimaryButton>
            </Flex>
          }
        />
      </Flex>
    )
  }
}

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
