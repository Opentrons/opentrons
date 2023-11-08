import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Btn,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_END,
  ALIGN_CENTER,
} from '@opentrons/components'
import { css } from 'styled-components'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'

interface ProbeNotAttachedProps {
  handleOnClick: () => void
  setShowUnableToDetect: (ableToDetect: boolean) => void
  isOnDevice: boolean
  isPending: boolean
}

export const ProbeNotAttached = (
  props: ProbeNotAttachedProps
): JSX.Element | null => {
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const { isOnDevice, isPending, handleOnClick, setShowUnableToDetect } = props
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)

  return (
    <SimpleWizardBody
      header={t('unable_to_detect_probe')}
      subHeader={numberOfTryAgains > 2 ? t('something_seems_wrong') : undefined}
      iconColor={COLORS.errorEnabled}
      isSuccess={false}
    >
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={ALIGN_BUTTONS}
        gridGap={SPACING.spacing8}
      >
        <Btn onClick={() => setShowUnableToDetect(false)}>
          <StyledText css={GO_BACK_BUTTON_STYLE}>
            {t('shared:go_back')}
          </StyledText>
        </Btn>
        {isOnDevice ? (
          <SmallButton
            buttonText={i18n.format(t('shared:try_again'), 'capitalize')}
            disabled={isPending}
            onClick={() => {
              setNumberOfTryAgains(numberOfTryAgains + 1)
              handleOnClick()
            }}
          />
        ) : (
          <PrimaryButton
            disabled={isPending}
            onClick={() => {
              setNumberOfTryAgains(numberOfTryAgains + 1)
              handleOnClick()
            }}
          >
            {i18n.format(t('shared:try_again'), 'capitalize')}
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
const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};
  padding-left: ${SPACING.spacing32};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};
    padding-left: 0rem;
    &:hover {
      opacity: 100%;
    }
  }
`
