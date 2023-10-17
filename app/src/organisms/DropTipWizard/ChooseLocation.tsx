import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  RESPONSIVENESS,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  useDeckLocationSelect,
} from '@opentrons/components'
import { NeedHelpLink } from '../CalibrationPanels'
import { TwoUpTileLayout } from '../LabwarePositionCheck/TwoUpTileLayout'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { RobotType, getDeckDefFromRobotType } from '@opentrons/shared-data'
import type { CommandData } from '@opentrons/api-client'

// TODO: get help link article URL
const NEED_HELP_URL = ''

interface ChooseLocationProps {
  handleProceed: () => void
  title: string
  body: string | JSX.Element
  robotType: RobotType
  moveToXYCoordinate: (x: number, y: number) => Promise<void | CommandData[]>
  isRobotMoving: boolean
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
  } = props
  const { t } = useTranslation(['drop_tip_wizard', 'shared'])
  const deckDef = getDeckDefFromRobotType(robotType)
  const { DeckLocationSelect, selectedLocation } = useDeckLocationSelect(
    robotType
  )

  const handleConfirmPosition: React.MouseEventHandler = () => {
    const deckLocation = deckDef.locations.orderedSlots.find(
      l => l.id === selectedLocation.slotName
    )
    const slotX = deckLocation?.position[0]
    const slotY = deckLocation?.position[1]
    const xDimension = deckLocation?.boundingBox.xDimension
    const yDimension = deckLocation?.boundingBox.yDimension
    if (
      slotX != null &&
      slotY != null &&
      xDimension != null &&
      yDimension != null
    ) {
      const targetX = slotX + xDimension / 2
      const targetY = slotY + yDimension / 2
      console.log(
        'MOVE TO selected location: ',
        selectedLocation,
        targetX,
        targetY
      )
      moveToXYCoordinate(targetX, targetY).then(handleProceed)
    }
  }

  return isRobotMoving ? (
    <InProgressModal
      alternativeSpinner={null}
      description={t('stand_back_exiting')}
    />
  ) : (
    <Flex css={TILE_CONTAINER_STYLE}>
      <TwoUpTileLayout
        title={title}
        body={body}
        rightElement={DeckLocationSelect}
        footer={
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <NeedHelpLink href={NEED_HELP_URL} />
            <PrimaryButton onClick={handleConfirmPosition}>
              {t('shared:confirm_position')}
            </PrimaryButton>
          </Flex>
        }
      />
    </Flex>
  )
}

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
