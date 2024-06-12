import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_INLINE_BLOCK,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton, MediumButton } from '../../atoms/buttons'
import { DT_ROUTES } from './constants'

import blowoutVideo from '../../assets/videos/droptip-wizard/Blowout-Liquid.webm'
import droptipVideo from '../../assets/videos/droptip-wizard/Drop-tip.webm'

import type { DropTipWizardContainerProps } from './types'

export const BeforeBeginning = ({
  proceedToRoute,
  isOnDevice,
  issuedCommandsType,
  fixitCommandTypeUtils,
}: DropTipWizardContainerProps): JSX.Element | null => {
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const [flowType, setFlowType] = React.useState<
    'blowout' | 'drop_tips' | null
  >(null)

  const handleProceed = (): void => {
    if (flowType === 'blowout') {
      void proceedToRoute(DT_ROUTES.BLOWOUT)
    } else if (flowType === 'drop_tips') {
      void proceedToRoute(DT_ROUTES.DROP_TIP)
    }
  }

  const buildTopText = (): string => {
    if (issuedCommandsType === 'fixit') {
      return fixitCommandTypeUtils?.copyOverrides
        .tipDropCompleteBtnCopy as string
    } else {
      return t('before_you_begin_do_you_want_to_blowout')
    }
  }

  if (isOnDevice) {
    return (
      <>
        <Flex flexDirection={DIRECTION_COLUMN} height="100%">
          <Flex css={ODD_TITLE_STYLE}>{buildTopText()}</Flex>
          <Flex paddingBottom={SPACING.spacing8}>
            <MediumButton
              buttonType={flowType === 'blowout' ? 'primary' : 'secondary'}
              flex="1"
              onClick={() => {
                setFlowType('blowout')
              }}
              buttonText={i18n.format(t('yes_blow_out_liquid'), 'capitalize')}
              justifyContent={JUSTIFY_FLEX_START}
              paddingLeft={SPACING.spacing24}
              height="5.25rem"
            />
          </Flex>
          <Flex>
            <MediumButton
              buttonType={flowType === 'drop_tips' ? 'primary' : 'secondary'}
              flex="1"
              onClick={() => {
                setFlowType('drop_tips')
              }}
              buttonText={i18n.format(
                t('no_proceed_to_drop_tip'),
                'capitalize'
              )}
              justifyContent={JUSTIFY_FLEX_START}
              paddingLeft={SPACING.spacing24}
              height="5.25rem"
            />
          </Flex>
          <Flex justifyContent={JUSTIFY_FLEX_END} marginTop="auto">
            <SmallButton
              buttonText={i18n.format(t('shared:continue'), 'capitalize')}
              onClick={handleProceed}
              disabled={flowType == null}
            />
          </Flex>
        </Flex>
      </>
    )
  } else {
    return (
      <Flex css={TILE_CONTAINER_STYLE}>
        <Title>{t('before_you_begin_do_you_want_to_blowout')}</Title>
        <Flex
          justifyContent={JUSTIFY_SPACE_AROUND}
          alignItems={ALIGN_CENTER}
          marginTop={SPACING.spacing16}
          marginBottom={SPACING.spacing32}
        >
          <Flex
            onClick={() => {
              setFlowType('blowout')
            }}
            css={
              flowType === 'blowout'
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
              aria-label="blowout"
            >
              <source src={blowoutVideo} />
            </video>
            <StyledText as="h3">{t('yes_blow_out_liquid')}</StyledText>
          </Flex>
          <Flex
            onClick={() => {
              setFlowType('drop_tips')
            }}
            css={
              flowType === 'drop_tips'
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
              aria-label="droptip"
            >
              <source src={droptipVideo} />
            </video>
            <StyledText as="h3">{t('no_proceed_to_drop_tip')}</StyledText>
          </Flex>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_FLEX_END}>
          {/* <NeedHelpLink href={NEED_HELP_URL} /> */}
          <PrimaryButton disabled={flowType == null} onClick={handleProceed}>
            {i18n.format(t('shared:continue'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </Flex>
    )
  }
}

const UNSELECTED_OPTIONS_STYLE = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius8};
  height: 12.5625rem;
  width: 14.5625rem;
  cursor: pointer;
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

const Title = styled.h1`
  ${TYPOGRAPHY.h1Default};
  margin-bottom: ${SPACING.spacing8};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold};
    margin-bottom: 0;
    height: ${SPACING.spacing40};
    display: ${DISPLAY_INLINE_BLOCK};
  }
`

const ODD_TITLE_STYLE = css`
  ${TYPOGRAPHY.level4HeaderSemiBold}
  margin-bottom: ${SPACING.spacing16};
`

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
