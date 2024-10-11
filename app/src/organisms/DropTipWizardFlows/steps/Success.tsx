import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  StyledText,
  ALIGN_CENTER,
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { DropTipFooterButtons } from '../shared'
import { DT_ROUTES } from '../constants'

import SuccessIcon from '../../../assets/images/icon_success.png'

import type { DropTipWizardContainerProps } from '../types'

export const Success = ({
  currentRoute,
  proceedToRouteAndStep,
  fixitCommandTypeUtils,
  proceedWithConditionalClose,
  modalStyle,
}: DropTipWizardContainerProps): JSX.Element => {
  const { tipDropComplete } = fixitCommandTypeUtils?.buttonOverrides ?? {}
  const { t } = useTranslation('drop_tip_wizard')

  // Route to the drop tip route if user is at the blowout success screen, otherwise proceed conditionally.
  const handleProceed = (): void => {
    if (currentRoute === DT_ROUTES.BLOWOUT) {
      void proceedToRouteAndStep(DT_ROUTES.DROP_TIP)
    } else {
      // Clear the error recovery submap upon completion of drop tip wizard.
      fixitCommandTypeUtils?.reportMap(null)

      if (tipDropComplete != null) {
        tipDropComplete()
      } else {
        proceedWithConditionalClose()
      }
    }
  }

  const buildProceedText = (): string => {
    if (fixitCommandTypeUtils != null && currentRoute === DT_ROUTES.DROP_TIP) {
      return fixitCommandTypeUtils.copyOverrides.tipDropCompleteBtnCopy
    } else {
      return currentRoute === DT_ROUTES.BLOWOUT ? t('continue') : t('exit')
    }
  }

  return (
    <>
      <Flex css={WIZARD_CONTAINER_STYLE}>
        <img
          src={SuccessIcon}
          alt="Success Icon"
          css={
            modalStyle === 'simple'
              ? SIMPLE_IMAGE_STYLE
              : INTERVENTION_IMAGE_STYLE
          }
        />
        <StyledText desktopStyle="headingSmallBold" oddStyle="level3HeaderBold">
          {currentRoute === DT_ROUTES.BLOWOUT
            ? t('blowout_complete')
            : t('drop_tip_complete')}
        </StyledText>
      </Flex>
      <DropTipFooterButtons
        primaryBtnOnClick={handleProceed}
        primaryBtnTextOverride={buildProceedText()}
      />
    </>
  )
}

const WIZARD_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing24};
  height: 100%;
  width: 100%;
`

const SHARED_IMAGE_STYLE = `
  width: 170px;
  height: 141px;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 282px;
    height: 234px;
    margin-top: 0;
  }
`

const SIMPLE_IMAGE_STYLE = css`
  ${SHARED_IMAGE_STYLE}
  margin-top: ${SPACING.spacing32};
`

const INTERVENTION_IMAGE_STYLE = css`
  ${SHARED_IMAGE_STYLE}
  margin-top: ${SPACING.spacing60};
`
