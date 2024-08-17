import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { POSITION_AND_BLOWOUT } from './constants'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  RESPONSIVENESS,
  SecondaryButton,
  SPACING,
  LegacyStyledText,
  TEXT_ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'
// import { NeedHelpLink } from '../CalibrationPanels'
import { JogControls } from '../../molecules/JogControls'
import { SmallButton, TextOnlyButton } from '../../atoms/buttons'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

import type { Jog } from '../../molecules/JogControls'
import type { DropTipWizardContainerProps } from './types'

// TODO: get help link article URL
// const NEED_HELP_URL = ''

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

type ConfirmPositionProps = DropTipWizardContainerProps & {
  handlePipetteAction: () => void
  handleGoBack: () => void
}

const ConfirmPosition = (props: ConfirmPositionProps): JSX.Element | null => {
  const {
    handlePipetteAction,
    handleGoBack,
    isOnDevice,
    currentStep,
    issuedCommandsType,
  } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const flowTitle = t('drop_tips')

  if (isOnDevice) {
    return (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={issuedCommandsType === 'setup' ? SPACING.spacing32 : null}
        padding={issuedCommandsType === 'fixit' ? SPACING.spacing32 : null}
      >
        <Flex
          gridGap={SPACING.spacing24}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          textAlign={TEXT_ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
          width="100%"
          height="20.25rem"
          padding={SPACING.spacing40}
        >
          <Flex gridGap={SPACING.spacing24}>
            <Icon
              name="ot-alert"
              size="3.75rem"
              color={COLORS.yellow50}
              aria-label="ot-alert"
            />
          </Flex>
          <LegacyStyledText
            fontSize={TYPOGRAPHY.fontSize32}
            fontWeight={TYPOGRAPHY.fontWeightBold}
          >
            {currentStep === POSITION_AND_BLOWOUT
              ? t('confirm_blowout_location', { flow: flowTitle })
              : t('confirm_drop_tip_location', { flow: flowTitle })}
          </LegacyStyledText>
        </Flex>
        <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex width="100%">
            <SmallButton
              buttonType="tertiaryLowLight"
              buttonText={t('shared:go_back')}
              onClick={handleGoBack}
            />
          </Flex>
          <Flex width="100%" justifyContent={JUSTIFY_END}>
            <SmallButton
              buttonText={
                currentStep === POSITION_AND_BLOWOUT
                  ? i18n.format(t('blowout_liquid'), 'capitalize')
                  : i18n.format(t('drop_tips'), 'capitalize')
              }
              onClick={handlePipetteAction}
            />
          </Flex>
        </Flex>
      </Flex>
    )
  } else {
    return (
      <SimpleWizardBody
        iconColor={COLORS.yellow50}
        marginTop={SPACING.spacing32}
        header={
          currentStep === POSITION_AND_BLOWOUT
            ? t('confirm_blowout_location', { flow: flowTitle })
            : t('confirm_drop_tip_location', { flow: flowTitle })
        }
        isSuccess={false}
      >
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          paddingLeft={SPACING.spacing32}
        >
          {/* <NeedHelpLink href={NEED_HELP_URL} /> */}
          <Flex
            gridGap={SPACING.spacing8}
            justifyContent={
              issuedCommandsType === 'setup'
                ? JUSTIFY_FLEX_END
                : JUSTIFY_SPACE_BETWEEN
            }
            width="100%"
          >
            {issuedCommandsType === 'setup' ? (
              <SecondaryButton onClick={handleGoBack}>
                {t('shared:go_back')}
              </SecondaryButton>
            ) : (
              <TextOnlyButton
                onClick={handleGoBack}
                buttonText={t('shared:go_back')}
              />
            )}
            <PrimaryButton onClick={handlePipetteAction}>
              {currentStep === POSITION_AND_BLOWOUT
                ? i18n.format(t('blowout_liquid'), 'capitalize')
                : i18n.format(t('drop_tips'), 'capitalize')}
            </PrimaryButton>
          </Flex>
        </Flex>
      </SimpleWizardBody>
    )
  }
}

type JogToPositionProps = DropTipWizardContainerProps & {
  handleGoBack: () => void
  handleJog: Jog
  handleProceed: () => void
  body: string
}

export const JogToPosition = (
  props: JogToPositionProps
): JSX.Element | null => {
  const {
    handleGoBack,
    handleJog,
    handleProceed,
    body,
    currentStep,
    isOnDevice,
    issuedCommandsType,
  } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const [
    showPositionConfirmation,
    setShowPositionConfirmation,
  ] = React.useState(false)
  // Includes special case homing only present in this step.
  const [isRobotInMotion, setIsRobotInMotion] = React.useState(false)

  const onGoBack = (): void => {
    setIsRobotInMotion(true)
    handleGoBack()
  }

  if (showPositionConfirmation) {
    return isRobotInMotion ? (
      <InProgressModal
        alternativeSpinner={null}
        description={
          currentStep === POSITION_AND_BLOWOUT
            ? t('stand_back_blowing_out')
            : t('stand_back_dropping_tips')
        }
      />
    ) : (
      <ConfirmPosition
        {...props}
        handlePipetteAction={() => {
          setIsRobotInMotion(true)
          handleProceed()
        }}
        handleGoBack={() => {
          setShowPositionConfirmation(false)
        }}
      />
    )
  }

  if (isOnDevice) {
    return (
      <Flex
        width="100%"
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        height="100%"
        gridGap={SPACING.spacing32}
        padding={issuedCommandsType === 'fixit' ? SPACING.spacing32 : null}
      >
        <JogControls jog={handleJog} isOnDevice={true} />
        <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex width="100%">
            <SmallButton
              buttonType="tertiaryLowLight"
              buttonText={t('shared:go_back')}
              onClick={onGoBack}
            />
          </Flex>
          <Flex width="100%" justifyContent={JUSTIFY_END}>
            <SmallButton
              buttonText={t('shared:confirm_position')}
              onClick={() => {
                setShowPositionConfirmation(true)
              }}
            />
          </Flex>
        </Flex>
      </Flex>
    )
  } else {
    return (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing32}
        gridGap={issuedCommandsType === 'fixit' ? SPACING.spacing24 : null}
        height="100%"
      >
        <Flex gridGap={SPACING.spacing24}>
          <Flex
            flex="1"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            alignItems={ALIGN_FLEX_START}
          >
            <Header>
              {i18n.format(t('position_the_pipette'), 'capitalize')}
            </Header>
            <LegacyStyledText as="p">{body}</LegacyStyledText>
          </Flex>
          {/* no animations */}
          {issuedCommandsType === 'setup' ? (
            <Flex
              flex="1"
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing20}
            />
          ) : null}
        </Flex>
        <JogControls jog={handleJog} />
        <Flex
          width="100%"
          marginTop={issuedCommandsType === 'setup' ? SPACING.spacing32 : null}
          gridGap={SPACING.spacing8}
          justifyContent={
            issuedCommandsType === 'setup'
              ? JUSTIFY_FLEX_END
              : JUSTIFY_SPACE_BETWEEN
          }
        >
          {/* <NeedHelpLink href={NEED_HELP_URL} /> */}
          {issuedCommandsType === 'setup' ? (
            <SecondaryButton onClick={onGoBack}>
              {t('shared:go_back')}
            </SecondaryButton>
          ) : (
            <TextOnlyButton
              onClick={onGoBack}
              buttonText={t('shared:go_back')}
            />
          )}
          <PrimaryButton
            onClick={() => {
              setShowPositionConfirmation(true)
            }}
          >
            {t('shared:confirm_position')}
          </PrimaryButton>
        </Flex>
      </Flex>
    )
  }
}
