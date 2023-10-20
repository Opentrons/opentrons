import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  DIRECTION_ROW,
  COLORS,
  BORDERS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  RESPONSIVENESS,
  JUSTIFY_FLEX_START,
  DISPLAY_INLINE_BLOCK,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  JUSTIFY_FLEX_END,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SmallButton, MediumButton } from '../../atoms/buttons'
import { NeedHelpLink } from '../CalibrationPanels'

import blowoutVideo from '../../assets/videos/droptip-wizard/Blowout-Liquid.webm'
import droptipVideo from '../../assets/videos/droptip-wizard/Drop-tip.webm'

// TODO: get help link article URL
const NEED_HELP_URL = ''

interface BeforeBeginningProps {
  handleCreateAndSetup: (shouldDispenseLiquid: boolean) => void
  isCreateLoading: boolean
  isOnDevice: boolean
}

export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const { handleCreateAndSetup, isCreateLoading, isOnDevice } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const [flowType, setFlowType] = React.useState<
    'liquid_and_tips' | 'only_tips' | null
  >(null)
  const handleProceed = (): void => {
    handleCreateAndSetup(flowType === 'liquid_and_tips')
  }

  return isOnDevice ? (
    <Flex
      padding={SPACING.spacing32}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="100%"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex css={TitleODD}>
          {t('before_you_begin_do_you_want_to_blowout')}
        </Flex>
        <Flex paddingBottom={SPACING.spacing8}>
          <MediumButton
            buttonType={
              flowType === 'liquid_and_tips' ? 'primary' : 'secondary'
            }
            flex="1"
            onClick={() => setFlowType('liquid_and_tips')}
            buttonText={i18n.format(t('yes_blow_out_liquid'), 'capitalize')}
            justifyContent={JUSTIFY_FLEX_START}
            paddingLeft={SPACING.spacing24}
          />
        </Flex>
        <Flex>
          <MediumButton
            buttonType={flowType === 'only_tips' ? 'primary' : 'secondary'}
            flex="1"
            onClick={() => {
              setFlowType('only_tips')
            }}
            buttonText={i18n.format(t('no_proceed_to_drop_tip'), 'capitalize')}
            justifyContent={JUSTIFY_FLEX_START}
            paddingLeft={SPACING.spacing24}
          />
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SmallButton
          buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          onClick={handleProceed}
          disabled={isCreateLoading || flowType == null}
        />
      </Flex>
    </Flex>
  ) : (
    <Flex css={TILE_CONTAINER_STYLE}>
      <Title>{t('before_you_begin_do_you_want_to_blowout')}</Title>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
        <Flex
          flex="1 0 auto"
          onClick={() => {
            setFlowType('liquid_and_tips')
          }}
          css={
            flowType === 'liquid_and_tips'
              ? SELECTED_OPTIONS_STYLE
              : UNSELECTED_OPTIONS_STYLE
          }
        >
          <Flex
            height="100%"
            width="100%"
            position={POSITION_ABSOLUTE}
            flex="1"
          />
          <video
            css={css`
              max-width: 11rem;
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
          flex="1 0 auto"
          onClick={() => setFlowType('only_tips')}
          css={
            flowType === 'only_tips'
              ? SELECTED_OPTIONS_STYLE
              : UNSELECTED_OPTIONS_STYLE
          }
        >
          <video
            css={css`
              max-width: 11rem;
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
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <NeedHelpLink href={NEED_HELP_URL} />
        <PrimaryButton
          disabled={isCreateLoading || flowType == null}
          onClick={handleProceed}
        >
          {i18n.format(t('shared:continue'), 'capitalize')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}

const UNSELECTED_OPTIONS_STYLE = css`
  background-color: ${COLORS.white};
  border: 1px solid ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
  height: 14.5625rem;
  width: 14.5625rem;
  cursor: pointer;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8}

  &:hover {
    border: 1px solid ${COLORS.medGreyHover};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    flex-direction: ${DIRECTION_ROW};
    justify-content: ${JUSTIFY_FLEX_START};
    background-color: ${COLORS.mediumBlueEnabled};
    border-width: 0; 
    border-radius: ${BORDERS.borderRadiusSize4};
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
  border: 1px solid ${COLORS.blueEnabled};
  background-color: ${COLORS.lightBlue};

  &:hover {
    border: 1px solid ${COLORS.blueEnabled};
    background-color: ${COLORS.lightBlue};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    border-width: 0px;
    background-color: ${COLORS.blueEnabled};
    color: ${COLORS.white};

    &:hover {
      border-width: 0px;
      background-color: ${COLORS.blueEnabled};
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

const TitleODD = css`
  ${TYPOGRAPHY.level4HeaderSemiBold}
  margin-bottom: ${SPACING.spacing16};
`

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
