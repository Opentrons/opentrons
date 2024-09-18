import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  StyledText,
  SPACING,
  LegacyStyledText,
  RESPONSIVENESS,
} from '@opentrons/components'

import { POSITION_AND_BLOWOUT } from '../constants'
import { JogControls } from '../../../molecules/JogControls'
import { DropTipFooterButtons } from '../shared'

import type { DropTipWizardContainerProps } from '../types'
import type { UseConfirmPositionResult } from '../ConfirmPosition'

type JogToPositionProps = DropTipWizardContainerProps & UseConfirmPositionResult

export const JogToPosition = (
  props: JogToPositionProps
): JSX.Element | null => {
  const {
    goBackRunValid,
    dropTipCommands,
    currentStep,
    isOnDevice,
    toggleShowConfirmPosition,
  } = props
  const { handleJog } = dropTipCommands
  const { t } = useTranslation('drop_tip_wizard')

  return (
    <>
      <Flex css={TITLE_SECTION_STYLE}>
        <StyledText
          desktopStyle="headingSmallBold"
          oddStyle="level4HeaderSemiBold"
        >
          {t('position_the_pipette')}
        </StyledText>
        <LegacyStyledText as="p">
          {currentStep === POSITION_AND_BLOWOUT
            ? t('position_and_blowout')
            : t('position_and_drop_tip')}
        </LegacyStyledText>
      </Flex>
      <JogControls jog={handleJog} isOnDevice={isOnDevice} />
      <DropTipFooterButtons
        primaryBtnOnClick={toggleShowConfirmPosition}
        primaryBtnTextOverride={t('shared:confirm_position')}
        secondaryBtnOnClick={goBackRunValid}
      />
    </>
  )
}

const TITLE_SECTION_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};

  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    display: none;
  }
`
