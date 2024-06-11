import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  COLORS,
} from '@opentrons/components'

import { SmallButton } from '../../../atoms/buttons'

interface RecoveryFooterButtonProps {
  isOnDevice: boolean
  primaryBtnOnClick: () => void
  secondaryBtnOnClick?: () => void
  primaryBtnTextOverride?: string
  /* If true, render pressed state and a spinner icon for the primary button. */
  isLoadingPrimaryBtnAction?: boolean
}
export function RecoveryFooterButtons({
  isOnDevice,
  secondaryBtnOnClick,
  primaryBtnOnClick,
  primaryBtnTextOverride,
  isLoadingPrimaryBtnAction,
}: RecoveryFooterButtonProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')

  const showGoBackBtn = secondaryBtnOnClick != null

  if (isOnDevice) {
    return (
      <Flex
        width="100%"
        height="100%"
        justifyContent={
          showGoBackBtn ? JUSTIFY_SPACE_BETWEEN : JUSTIFY_FLEX_END
        }
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
      >
        {showGoBackBtn ? (
          <SmallButton
            buttonType="tertiaryLowLight"
            buttonText={t('go_back')}
            onClick={secondaryBtnOnClick}
            marginTop="auto"
          />
        ) : null}
        <SmallButton
          css={isLoadingPrimaryBtnAction ? PRESSED_LOADING_STATE : undefined}
          iconName={isLoadingPrimaryBtnAction ? 'ot-spinner' : null}
          iconPlacement={isLoadingPrimaryBtnAction ? 'startIcon' : null}
          buttonType="primary"
          buttonText={primaryBtnTextOverride ?? t('continue')}
          onClick={primaryBtnOnClick}
          marginTop="auto"
        />
      </Flex>
    )
  } else {
    return null
  }
}

const PRESSED_LOADING_STATE = css`
  background-color: ${COLORS.blue60};
  &:focus {
    background-color: ${COLORS.blue60};
  }
  &:hover {
    background-color: ${COLORS.blue60};
  }
  &:focus-visible {
    background-color: ${COLORS.blue60};
  }
  &:active {
    background-color: ${COLORS.blue60};
  }
`
