import { useState } from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  CURSOR_POINTER,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_AROUND,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  StyledText,
} from '@opentrons/components'

import { MediumButton } from '../../../atoms/buttons'
import { DT_ROUTES } from '../constants'
import { DropTipFooterButtons } from '../shared'

import blowoutVideo from '../../../assets/videos/droptip-wizard/Blowout-Liquid.webm'
import droptipVideo from '../../../assets/videos/droptip-wizard/Drop-tip.webm'

import type { DropTipWizardContainerProps } from '../types'

type FlowType = 'blowout' | 'drop_tips' | null

export const BeforeBeginning = ({
  proceedToRouteAndStep,
  isOnDevice,
  issuedCommandsType,
  fixitCommandTypeUtils,
  modalStyle,
}: DropTipWizardContainerProps): JSX.Element | null => {
  const { t } = useTranslation('drop_tip_wizard')
  const [flowType, setFlowType] = useState<FlowType>(null)

  const handleProceed = (): void => {
    if (flowType === 'blowout') {
      void proceedToRouteAndStep(DT_ROUTES.BLOWOUT)
    } else if (flowType === 'drop_tips') {
      void proceedToRouteAndStep(DT_ROUTES.DROP_TIP)
    }
  }

  const buildTopText = (): string => {
    if (issuedCommandsType === 'fixit') {
      return fixitCommandTypeUtils?.copyOverrides
        .beforeBeginningTopText as string
    } else {
      return t('before_you_begin_do_you_want_to_blowout')
    }
  }

  if (isOnDevice) {
    return (
      <>
        <Flex css={CONTAINER_STYLE}>
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
          >
            {buildTopText()}
          </StyledText>
          <MediumButton
            css={ODD_MEDIUM_BUTTON_STYLE}
            buttonType={flowType === 'blowout' ? 'primary' : 'secondary'}
            onClick={() => {
              setFlowType('blowout')
            }}
            buttonText={t('yes_blow_out_liquid')}
          />
          <MediumButton
            css={ODD_MEDIUM_BUTTON_STYLE}
            buttonType={flowType === 'drop_tips' ? 'primary' : 'secondary'}
            onClick={() => {
              setFlowType('drop_tips')
            }}
            buttonText={t('no_proceed_to_drop_tip')}
          />
        </Flex>
        <DropTipFooterButtons
          primaryBtnOnClick={handleProceed}
          primaryBtnDisabled={flowType == null}
          secondaryBtnOnClick={
            fixitCommandTypeUtils?.buttonOverrides.goBackBeforeBeginning ??
            undefined
          }
        />
      </>
    )
  } else {
    return (
      <>
        <Flex css={CONTAINER_STYLE}>
          <StyledText
            desktopStyle="headingSmallBold"
            oddStyle="level4HeaderSemiBold"
          >
            {buildTopText()}
          </StyledText>
          <Flex
            css={
              modalStyle === 'simple'
                ? SIMPLE_DESKTOP_GIF_CONTAINER_STYLE
                : INTERVENTION_DESKTOP_GIF_CONTAINER_STYLE
            }
          >
            <DropTipOption
              flowType="blowout"
              currentFlow={flowType}
              onClick={() => {
                setFlowType('blowout')
              }}
              videoSrc={blowoutVideo}
              text={t('yes_blow_out_liquid')}
            />
            <DropTipOption
              flowType="drop_tips"
              currentFlow={flowType}
              onClick={() => {
                setFlowType('drop_tips')
              }}
              videoSrc={droptipVideo}
              text={t('no_proceed_to_drop_tip')}
            />
          </Flex>
        </Flex>
        <DropTipFooterButtons
          primaryBtnOnClick={handleProceed}
          primaryBtnDisabled={flowType == null}
          secondaryBtnOnClick={
            fixitCommandTypeUtils?.buttonOverrides.goBackBeforeBeginning ??
            undefined
          }
        />
      </>
    )
  }
}

function DropTipOption({
  flowType,
  currentFlow,
  onClick,
  videoSrc,
  text,
}: {
  flowType: 'blowout' | 'drop_tips'
  currentFlow: FlowType
  onClick: () => void
  videoSrc: string
  text: string
}): JSX.Element {
  return (
    <Flex
      onClick={onClick}
      css={
        flowType === currentFlow
          ? SELECTED_OPTIONS_STYLE
          : UNSELECTED_OPTIONS_STYLE
      }
    >
      <video
        css={css`
          max-width: 8.96rem;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
        aria-label={flowType}
      >
        <source src={videoSrc} />
      </video>
      <LegacyStyledText as="h3">{text}</LegacyStyledText>
    </Flex>
  )
}

const UNSELECTED_OPTIONS_STYLE = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  height: 12.5625rem;
  width: 14.5625rem;
  cursor: ${CURSOR_POINTER};
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8};

  &:hover {
    border: 1px solid ${COLORS.grey35};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    flex-direction: ${DIRECTION_ROW};
    justify-content: ${JUSTIFY_FLEX_START};
    background-color: ${COLORS.blue35};
    border-width: 0;
    border-radius: ${BORDERS.borderRadius16};
    padding: ${SPACING.spacing24};
    height: 5.25rem;
    width: 57.8125rem;

    &:hover {
      border-width: 0px;
    }
  }
`
const SELECTED_OPTIONS_STYLE = css`
  ${UNSELECTED_OPTIONS_STYLE}
  border: 1px solid ${COLORS.blue50};
  background-color: ${COLORS.blue30};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-width: 0px;
    background-color: ${COLORS.blue50};
    color: ${COLORS.white};

    &:hover {
      border-width: 0px;
      background-color: ${COLORS.blue50};
    }
  }
`

const CONTAINER_STYLE = css`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
`

const ODD_MEDIUM_BUTTON_STYLE = css`
  flex: 1;
  justify-content: ${JUSTIFY_FLEX_START};
  padding-left: ${SPACING.spacing24};
  height: 5.25rem;
`

const SHARED_GIF_CONTAINER_STYLE = `
  justify-content: ${JUSTIFY_SPACE_AROUND};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing16};
`

const SIMPLE_DESKTOP_GIF_CONTAINER_STYLE = css`
  ${SHARED_GIF_CONTAINER_STYLE}
  height: 18.75rem;
`

const INTERVENTION_DESKTOP_GIF_CONTAINER_STYLE = css`
  ${SHARED_GIF_CONTAINER_STYLE}
  height: 14.563rem;
`
