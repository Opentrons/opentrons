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
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import type { PipetteWizardStepProps } from './types'

export const AttachWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element => {
  const { isRobotMoving, errorMessage, proceed, goBack } = props

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleOnClick = (): void => {
    proceed()
  }

  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      isSuccess={false}
      subHeader={errorMessage}
    />
  ) : (
    <SimpleWizardBody
      header={t('attach_wastechute')}
      subHeader={t('waste_chute_attach_warning')}
      iconColor={COLORS.yellow50}
      isSuccess={false}
    >
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={ALIGN_BUTTONS}
        gridGap={SPACING.spacing8}
      >
        <Btn onClick={goBack}>
          <span css={GO_BACK_BUTTON_STYLE}>{t('shared:go_back')}</span>
        </Btn>
        <PrimaryButton onClick={handleOnClick}>
          {i18n.format(t('shared:continue'), 'capitalize')}
        </PrimaryButton>
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
  color: ${COLORS.grey50};
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
