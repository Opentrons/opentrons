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

import { DT_ROUTES } from '../constants'
import { JogControls } from '/app/molecules/JogControls'
import { DropTipFooterButtons } from '../shared'

import type { DropTipWizardContainerProps } from '../types'
import type { UseConfirmPositionResult } from './ConfirmPosition'

type JogToPositionProps = DropTipWizardContainerProps & UseConfirmPositionResult

export const JogToPosition = ({
  goBackRunValid,
  dropTipCommands,
  currentRoute,
  isOnDevice,
  modalStyle,
  proceed,
}: JogToPositionProps): JSX.Element | null => {
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
          {currentRoute === DT_ROUTES.BLOWOUT
            ? t('position_and_blowout')
            : t('position_and_drop_tip')}
        </LegacyStyledText>
      </Flex>
      <Flex
        css={
          modalStyle === 'simple'
            ? SIMPLE_CONTENT_SECTION_STYLE
            : INTERVENTION_CONTENT_SECTION_STYLE
        }
      >
        <JogControls
          jog={handleJog}
          isOnDevice={isOnDevice}
          height={isOnDevice ? '80%' : '100%'}
        />
        <DropTipFooterButtons
          primaryBtnOnClick={proceed}
          primaryBtnTextOverride={t('shared:confirm_position')}
          secondaryBtnOnClick={goBackRunValid}
        />
      </Flex>
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

const SHARED_CONTENT_SECTION_STYLE = `
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
`

const SIMPLE_CONTENT_SECTION_STYLE = css`
  ${SHARED_CONTENT_SECTION_STYLE}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: 1.5rem;
  }
`

const INTERVENTION_CONTENT_SECTION_STYLE = css`
  ${SHARED_CONTENT_SECTION_STYLE}
  grid-gap: ${SPACING.spacing40};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: 0.9rem;
  }
`
