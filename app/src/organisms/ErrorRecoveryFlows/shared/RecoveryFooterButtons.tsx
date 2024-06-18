import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  COLORS,
} from '@opentrons/components'

import { SmallButton } from '../../../atoms/buttons'

interface RecoveryFooterButtonProps {
  isOnDevice: boolean
  primaryBtnOnClick: () => void
  /* The "Go back" button */
  secondaryBtnOnClick?: () => void
  primaryBtnTextOverride?: string
  /* If true, render pressed state and a spinner icon for the primary button. */
  isLoadingPrimaryBtnAction?: boolean
  /* To the left of the primary button. */
  tertiaryBtnOnClick?: () => void
  tertiaryBtnText?: string
  tertiaryBtnDisabled?: boolean
}
export function RecoveryFooterButtons(
  props: RecoveryFooterButtonProps
): JSX.Element | null {
  const { isOnDevice, secondaryBtnOnClick } = props
  const { t } = useTranslation('error_recovery')

  const showGoBackBtn = secondaryBtnOnClick != null

  if (isOnDevice) {
    return (
      <Flex
        width="100%"
        height="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
      >
        <Flex marginTop="auto">
          {showGoBackBtn ? (
            <SmallButton
              buttonType="tertiaryLowLight"
              buttonText={t('go_back')}
              onClick={secondaryBtnOnClick}
              marginTop="auto"
            />
          ) : null}
        </Flex>
        <PrimaryButtonGroup {...props} />
      </Flex>
    )
  } else {
    return null
  }
}

function PrimaryButtonGroup(props: RecoveryFooterButtonProps): JSX.Element {
  const { tertiaryBtnDisabled, tertiaryBtnOnClick, tertiaryBtnText } = props

  const renderTertiaryBtn =
    tertiaryBtnOnClick != null || tertiaryBtnText != null

  const tertiaryBtnDefaultOnClick = (): null => null

  if (!renderTertiaryBtn) {
    return (
      <Flex marginTop="auto">
        <RecoveryPrimaryBtn {...props} />
      </Flex>
    )
  } else {
    return (
      <Flex gridGap={SPACING.spacing8} marginTop="auto">
        <SmallButton
          buttonType="secondary"
          onClick={tertiaryBtnOnClick ?? tertiaryBtnDefaultOnClick}
          buttonText={tertiaryBtnText}
          disabled={tertiaryBtnDisabled}
        />
        <RecoveryPrimaryBtn {...props} />
      </Flex>
    )
  }
}

function RecoveryPrimaryBtn({
  isLoadingPrimaryBtnAction,
  primaryBtnOnClick,
  primaryBtnTextOverride,
}: RecoveryFooterButtonProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  return (
    <SmallButton
      css={isLoadingPrimaryBtnAction ? PRESSED_LOADING_STATE : undefined}
      iconName={isLoadingPrimaryBtnAction ? 'ot-spinner' : null}
      iconPlacement={isLoadingPrimaryBtnAction ? 'startIcon' : null}
      buttonType="primary"
      buttonText={primaryBtnTextOverride ?? t('continue')}
      onClick={primaryBtnOnClick}
      marginTop="auto"
    />
  )
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
