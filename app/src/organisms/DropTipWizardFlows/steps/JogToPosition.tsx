import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  RESPONSIVENESS,
  SPACING,
} from '@opentrons/components'

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
      <Flex
        css={
          modalStyle === 'simple'
            ? SIMPLE_CONTENT_SECTION_STYLE
            : INTERVENTION_CONTENT_SECTION_STYLE
        }
      >
        <JogControls jog={handleJog} isOnDevice={isOnDevice} />

        <DropTipFooterButtons
          primaryBtnOnClick={proceed}
          primaryBtnTextOverride={t('shared:confirm_position')}
          secondaryBtnOnClick={goBackRunValid}
        />
      </Flex>
    </>
  )
}

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
