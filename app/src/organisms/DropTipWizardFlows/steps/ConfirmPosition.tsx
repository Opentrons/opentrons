import { useState, useEffect } from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  DISPLAY_FLEX,
  TEXT_ALIGN_CENTER,
  RESPONSIVENESS,
  StyledText,
} from '@opentrons/components'

import {
  CHOOSE_LOCATION_OPTION,
  CONFIRM_POSITION,
  DT_ROUTES,
} from '../constants'
import { DropTipFooterButtons } from '../shared'

import type { DropTipWizardContainerProps } from '../types'

export interface UseConfirmPositionResult {
  isRobotPipetteMoving: boolean
  toggleIsRobotPipetteMoving: () => void
}

// Handles confirming the position. Because pipette drop tip/blowout actions do not trigger
// an "in-motion" the same way other commands do, we synthetically create an "in motion", disabling
// it once the step has completed or failed.
export function useConfirmPosition(
  currentStep: DropTipWizardContainerProps['currentStep']
): UseConfirmPositionResult {
  const [isRobotPipetteMoving, setIsRobotPipetteMoving] = useState(false)

  const toggleIsRobotPipetteMoving = (): void => {
    setIsRobotPipetteMoving(!isRobotPipetteMoving)
  }

  useEffect(() => {
    if (
      isRobotPipetteMoving &&
      currentStep !== CONFIRM_POSITION &&
      currentStep !== CHOOSE_LOCATION_OPTION
    ) {
      toggleIsRobotPipetteMoving()
    }
  }, [currentStep, isRobotPipetteMoving])

  return {
    toggleIsRobotPipetteMoving,
    isRobotPipetteMoving,
  }
}

type ConfirmPositionProps = DropTipWizardContainerProps &
  UseConfirmPositionResult

export function ConfirmPosition({
  toggleIsRobotPipetteMoving,
  goBackRunValid,
  currentRoute,
  dropTipCommands,
  proceed,
  modalStyle,
}: ConfirmPositionProps): JSX.Element {
  const { blowoutOrDropTip } = dropTipCommands
  const { t } = useTranslation('drop_tip_wizard')

  const buildPrimaryBtnText = (): string =>
    currentRoute === DT_ROUTES.BLOWOUT ? t('blowout_liquid') : t('drop_tips')

  const handleProceed = (): void => {
    toggleIsRobotPipetteMoving()
    void blowoutOrDropTip(currentRoute, proceed)
  }

  return (
    <>
      <Flex
        css={
          modalStyle === 'simple'
            ? SIMPLE_CONTAINER_STYLE
            : INTERVENTION_CONTAINER_STYLE
        }
      >
        <Icon name="alert-circle" css={ICON_STYLE} />
        <StyledText oddStyle="level3HeaderBold" desktopStyle="headingSmallBold">
          {currentRoute === DT_ROUTES.BLOWOUT
            ? t('confirm_blowout_location')
            : t('confirm_drop_tip_location')}
        </StyledText>
      </Flex>
      <DropTipFooterButtons
        primaryBtnOnClick={handleProceed}
        primaryBtnTextOverride={buildPrimaryBtnText()}
        secondaryBtnOnClick={goBackRunValid}
      />
    </>
  )
}

const SHARED_CONTAINER_STYLE = `
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  padding: ${SPACING.spacing40} ${SPACING.spacing16};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  text-align: ${TEXT_ALIGN_CENTER};
  
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing24};
    padding: ${SPACING.spacing40};
  }
`

const INTERVENTION_CONTAINER_STYLE = css`
  ${SHARED_CONTAINER_STYLE}
  margin-top: ${SPACING.spacing60};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    margin-top: ${SPACING.spacing48};
  }
`

const SIMPLE_CONTAINER_STYLE = css`
  ${SHARED_CONTAINER_STYLE}
  margin-top: ${SPACING.spacing32};
`

const ICON_STYLE = css`
  width: 40px;
  height: 40px;
  color: ${COLORS.yellow50};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 60px;
    height: 60px;
  }
`
