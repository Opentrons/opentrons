import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Box,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_STICKY,
  PrimaryButton,
  RESPONSIVENESS,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import { SmallButton, TextOnlyButton } from '/app/atoms/buttons'

import type { ReactNode } from 'react'

interface RecoveryFooterButtonProps {
  primaryBtnOnClick: () => void
  primaryBtnTextOverride?: string
  primaryBtnDisabled?: boolean
  /* If true, render pressed state and a spinner icon for the primary button. */
  isLoadingPrimaryBtnAction?: boolean
  /* Typically the "Go back" button */
  secondaryBtnOnClick?: () => void
  secondaryBtnTextOverride?: string
  /* To the left of the primary button. */
  tertiaryBtnOnClick?: () => void
  tertiaryBtnText?: string
  tertiaryBtnDisabled?: boolean
  /* Use the style of the secondary button in the position typically used by the tertiary button. */
  secondaryAsTertiary?: boolean
  /* Makes the footer buttons sticky to the bottom of their container. */
  isSticky?: boolean
}
export function RecoveryFooterButtons(
  props: RecoveryFooterButtonProps
): JSX.Element | null {
  return (
    <Flex
      width="100%"
      height="100%"
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_FLEX_END}
      gridGap={SPACING.spacing8}
      css={props.isSticky != null ? STICKY_FOOTER_STYLE : undefined}
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        {!props.secondaryAsTertiary && <RecoveryGoBackButton {...props} />}
        <PrimaryButtonGroup {...props} />
      </Flex>
    </Flex>
  )
}

function RecoveryGoBackButton({
  secondaryBtnTextOverride,
  secondaryBtnOnClick,
}: RecoveryFooterButtonProps): JSX.Element | null {
  const showGoBackBtn = secondaryBtnOnClick != null
  const { t } = useTranslation('error_recovery')
  return showGoBackBtn ? (
    <TextOnlyButton
      onClick={secondaryBtnOnClick}
      buttonText={secondaryBtnTextOverride ?? t('go_back')}
    />
  ) : (
    <Box />
  )
}

function PrimaryButtonGroup(props: RecoveryFooterButtonProps): ReactNode {
  const {
    tertiaryBtnOnClick,
    tertiaryBtnText,
    secondaryAsTertiary,
    secondaryBtnOnClick,
    isSticky,
  } = props

  const renderTertiaryBtn =
    tertiaryBtnOnClick != null ||
    tertiaryBtnText != null ||
    (secondaryBtnOnClick != null && secondaryAsTertiary)

  if (!renderTertiaryBtn) {
    return (
      <Flex marginTop={isSticky ? '1rem' : undefined}>
        <RecoveryPrimaryBtn {...props} />
      </Flex>
    )
  } else {
    return (
      <Flex
        gridGap={secondaryAsTertiary ? SPACING.spacing32 : SPACING.spacing8}
        marginLeft={secondaryAsTertiary ? 'auto' : undefined}
        marginTop={isSticky ? '1rem' : undefined}
      >
        {secondaryAsTertiary ? (
          <RecoveryGoBackButton {...props} />
        ) : (
          <RecoveryTertiaryBtn {...props} />
        )}
        <RecoveryPrimaryBtn {...props} />
      </Flex>
    )
  }
}

function RecoveryPrimaryBtn({
  isLoadingPrimaryBtnAction,
  primaryBtnOnClick,
  primaryBtnDisabled,
  primaryBtnTextOverride,
}: RecoveryFooterButtonProps): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <>
      <SmallButton
        css={
          isLoadingPrimaryBtnAction
            ? css`
                ${PRESSED_LOADING_STATE} ${ODD_ONLY_BUTTON}
              `
            : ODD_ONLY_BUTTON
        }
        iconName={isLoadingPrimaryBtnAction ? 'ot-spinner' : null}
        iconPlacement={isLoadingPrimaryBtnAction ? 'startIcon' : null}
        buttonType="primary"
        buttonText={primaryBtnTextOverride ?? t('continue')}
        onClick={primaryBtnOnClick}
        disabled={primaryBtnDisabled}
      />
      <PrimaryButton
        css={
          isLoadingPrimaryBtnAction
            ? css`
                ${PRESSED_LOADING_STATE} ${DESKTOP_ONLY_BUTTON}
              `
            : DESKTOP_ONLY_BUTTON
        }
        onClick={primaryBtnOnClick}
        disabled={primaryBtnDisabled}
      >
        <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
          {isLoadingPrimaryBtnAction && (
            <Icon name="ot-spinner" size={SPACING.spacing16} spin={true} />
          )}
          {primaryBtnTextOverride ?? t('continue')}
        </Flex>
      </PrimaryButton>
    </>
  )
}

function RecoveryTertiaryBtn({
  tertiaryBtnOnClick,
  tertiaryBtnText,
  tertiaryBtnDisabled,
}: RecoveryFooterButtonProps): ReactNode {
  const tertiaryBtnDefaultOnClick = (): null => null

  return (
    <>
      <SmallButton
        buttonType="secondary"
        onClick={tertiaryBtnOnClick ?? tertiaryBtnDefaultOnClick}
        buttonText={tertiaryBtnText}
        disabled={tertiaryBtnDisabled}
        css={ODD_ONLY_BUTTON}
      />
      <SecondaryButton
        onClick={tertiaryBtnOnClick ?? tertiaryBtnDefaultOnClick}
        disabled={tertiaryBtnDisabled}
        css={DESKTOP_ONLY_BUTTON}
      >
        {tertiaryBtnText}
      </SecondaryButton>
    </>
  )
}

const STICKY_FOOTER_STYLE = css`
  position: ${POSITION_STICKY};
  bottom: 0;
  background-color: ${COLORS.white};
  z-index: 1;
`

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

const ODD_ONLY_BUTTON = css`
  @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    display: none;
  }
`

const DESKTOP_ONLY_BUTTON = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: none;
  }
`
