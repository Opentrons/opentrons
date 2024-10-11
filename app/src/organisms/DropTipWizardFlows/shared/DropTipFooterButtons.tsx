import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  PrimaryButton,
  AlertPrimaryButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Box,
  RESPONSIVENESS,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { TextOnlyButton, SmallButton } from '../../../atoms/buttons'

interface DropTipFooterButtonsProps {
  primaryBtnOnClick: () => void
  primaryBtnTextOverride?: string
  primaryBtnDisabled?: boolean
  primaryBtnStyle?: 'defaultStyle' | 'alertStyle'
  /* Typically the "Go back" button. If no onClick is supplied, the button does not render. */
  secondaryBtnOnClick?: () => void
}

export function DropTipFooterButtons(
  props: DropTipFooterButtonsProps
): JSX.Element {
  return (
    <Flex width="100%" height="100%" alignItems={ALIGN_FLEX_END}>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <DropTipGoBackButton {...props} />
        <DropTipPrimaryBtn {...props} />
      </Flex>
    </Flex>
  )
}

function DropTipGoBackButton({
  secondaryBtnOnClick,
}: DropTipFooterButtonsProps): JSX.Element | null {
  const showGoBackBtn = secondaryBtnOnClick != null
  const { t } = useTranslation('drop_tip_wizard')
  return showGoBackBtn ? (
    <Flex>
      <TextOnlyButton onClick={secondaryBtnOnClick} buttonText={t('go_back')} />
    </Flex>
  ) : (
    <Box />
  )
}

function DropTipPrimaryBtn({
  primaryBtnOnClick,
  primaryBtnTextOverride,
  primaryBtnDisabled,
  primaryBtnStyle,
}: DropTipFooterButtonsProps): JSX.Element {
  const { t } = useTranslation('drop_tip_wizard')

  return (
    <>
      <SmallButton
        css={ODD_ONLY_BUTTON}
        buttonType={primaryBtnStyle === 'alertStyle' ? 'alert' : 'primary'}
        buttonText={primaryBtnTextOverride ?? t('continue')}
        onClick={primaryBtnOnClick}
        disabled={primaryBtnDisabled}
      />
      {primaryBtnStyle === 'alertStyle' ? (
        <AlertPrimaryButton
          css={DESKTOP_ONLY_BUTTON}
          onClick={primaryBtnOnClick}
          disabled={primaryBtnDisabled}
        >
          {primaryBtnTextOverride ?? t('continue')}
        </AlertPrimaryButton>
      ) : (
        <PrimaryButton
          css={DESKTOP_ONLY_BUTTON}
          onClick={primaryBtnOnClick}
          disabled={primaryBtnDisabled}
        >
          {primaryBtnTextOverride ?? t('continue')}
        </PrimaryButton>
      )}
    </>
  )
}

const DESKTOP_ONLY_BUTTON = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: none;
  }
`

const ODD_ONLY_BUTTON = css`
  @media not (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    display: none;
  }
`
