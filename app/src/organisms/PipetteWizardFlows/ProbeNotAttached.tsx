import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Btn,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

interface ProbeNotAttachedProps {
  handleOnClick: () => void
  dismissError: () => void
  isOnDevice: boolean
}

// TODO(jh 01-07-25): This component is utilized by other flows. Let's hoist it out of PipetteWizardFlows.

export const ProbeNotAttached = (
  props: ProbeNotAttachedProps
): JSX.Element | null => {
  const { t } = useTranslation(['pipette_wizard_flows', 'shared', 'branded'])
  const { isOnDevice, handleOnClick, dismissError } = props
  const [numberOfTryAgains, setNumberOfTryAgains] = useState<number>(0)

  return (
    <SimpleWizardBody
      header={t('unable_to_detect_probe')}
      subHeader={
        numberOfTryAgains > 2 ? t('branded:something_seems_wrong') : undefined
      }
      iconColor={COLORS.red50}
      isSuccess={false}
    >
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={ALIGN_BUTTONS}
        gridGap={SPACING.spacing8}
      >
        <Btn
          onClick={() => {
            dismissError()
          }}
        >
          <StyledText
            desktopStyle="bodyDefaultSemiBold"
            oddStyle="bodyTextSemiBold"
            color={COLORS.grey50}
            paddingLeft={SPACING.spacing32}
          >
            {t('shared:go_back')}
          </StyledText>
        </Btn>
        {isOnDevice ? (
          <SmallButton
            buttonText={t('try_again')}
            onClick={() => {
              setNumberOfTryAgains(numberOfTryAgains + 1)
              handleOnClick()
            }}
          />
        ) : (
          <PrimaryButton
            onClick={() => {
              setNumberOfTryAgains(numberOfTryAgains + 1)
              handleOnClick()
            }}
          >
            {t('try_again')}
          </PrimaryButton>
        )}
      </Flex>
    </SimpleWizardBody>
  )
}

const ALIGN_BUTTONS = css`
  align-items: ${ALIGN_FLEX_END};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-items: ${ALIGN_CENTER};
  }
`
