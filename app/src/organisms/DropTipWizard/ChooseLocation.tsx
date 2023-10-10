import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Flex, DIRECTION_COLUMN, DIRECTION_ROW, ALIGN_CENTER, RESPONSIVENESS, JUSTIFY_SPACE_BETWEEN, PrimaryButton, useDeckLocationSelect } from '@opentrons/components'
import { NeedHelpLink } from '../CalibrationPanels'
import { TwoUpTileLayout } from '../LabwarePositionCheck/TwoUpTileLayout'
import { RobotType } from '@opentrons/shared-data'

// TODO: get help link article URL
const NEED_HELP_URL = ''

interface ChooseLocationProps {
  handleProceed: () => void
  title: string
  body: string | JSX.Element
  robotType: RobotType
}

export const ChooseLocation = (
  props: ChooseLocationProps
): JSX.Element | null => {
  const { handleProceed, title, body, robotType } = props
  const { t } = useTranslation(['drop_tip_wizard', 'shared'])
  const { DeckLocationSelect, selectedLocation } = useDeckLocationSelect(robotType)

  const handleConfirmPosition: React.MouseEventHandler = () => {
    console.log('MOVE TO selected location: ', selectedLocation)
    handleProceed()
  }
  return (
    <Flex css={TILE_CONTAINER_STYLE}>
      <TwoUpTileLayout
        title={title}
        body={body}
        rightElement={DeckLocationSelect}
        footer={
          <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
            <NeedHelpLink href={NEED_HELP_URL} />
            <PrimaryButton
              onClick={handleConfirmPosition}>
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