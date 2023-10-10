import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Flex, SPACING, DIRECTION_COLUMN, DIRECTION_ROW, ALIGN_CENTER, RESPONSIVENESS, JUSTIFY_SPACE_BETWEEN, PrimaryButton, SecondaryButton } from '@opentrons/components'
import { NeedHelpLink } from '../CalibrationPanels'
import { TwoUpTileLayout } from '../LabwarePositionCheck/TwoUpTileLayout'

// TODO: get help link article URL
const NEED_HELP_URL = ''

interface ChooseLocationProps {
  handleProceed: () => void
  title: string
  body: string
}

export const ChooseLocation = (
  props: ChooseLocationProps
): JSX.Element | null => {
  const { handleProceed, title, body } = props
  const { t } = useTranslation(['gripper_wizard_flows', 'shared'])

  return (
    <Flex css={TILE_CONTAINER_STYLE}>
      <TwoUpTileLayout
        title={title}
        body={body}
        rightElement={<div>TODO: add graphic</div>}
        footer={
          <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
            <NeedHelpLink href={NEED_HELP_URL} />
            <PrimaryButton
              onClick={handleProceed}>
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