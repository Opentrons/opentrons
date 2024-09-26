import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  COLORS,
  StyledText,
  Icon,
  Flex,
  RESPONSIVENESS,
  DISPLAY_FLEX,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import { DropTipFooterButtons } from './shared'

import type { DropTipWizardContainerProps } from './types'

export function ExitConfirmation(
  props: DropTipWizardContainerProps
): JSX.Element {
  const { mount, cancelExit, toggleExitInitiated, confirmExit } = props
  const { t } = useTranslation('drop_tip_wizard')

  const handleExit = (): void => {
    toggleExitInitiated()
    confirmExit()
  }

  return (
    <>
      <Flex css={CONTAINER_STYLE}>
        <Icon name="alert-circle" css={ICON_STYLE} />
        <StyledText oddStyle="level3HeaderBold" desktopStyle="headingSmallBold">
          {t('remove_any_attached_tips')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          oddStyle="level4HeaderRegular"
        >
          <Trans
            t={t}
            i18nKey="liquid_damages_this_pipette"
            values={{
              mount,
            }}
            components={{
              mount: <strong />,
            }}
          />
        </StyledText>
      </Flex>
      <DropTipFooterButtons
        primaryBtnOnClick={handleExit}
        secondaryBtnOnClick={cancelExit}
        primaryBtnTextOverride={t('exit_and_home_pipette')}
        primaryBtnStyle="alertStyle"
      />
    </>
  )
}

const CONTAINER_STYLE = css`
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

const ICON_STYLE = css`
  width: 40px;
  height: 40px;
  color: ${COLORS.red50};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 60px;
    height: 60px;
  }
`
