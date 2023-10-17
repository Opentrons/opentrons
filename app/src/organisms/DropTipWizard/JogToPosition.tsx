import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { POSITION_AND_BLOWOUT } from './constants'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  RESPONSIVENESS,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  ALIGN_FLEX_START,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'
import { NeedHelpLink } from '../CalibrationPanels'
import { SmallButton } from '../../atoms/buttons'
import { Jog, JogControls } from '../../molecules/JogControls'
import { Portal } from '../../App/portal'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { StyledText } from '../../atoms/text'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { PipetteModelSpecs } from '@opentrons/shared-data'

// TODO: get help link article URL
const NEED_HELP_URL = ''

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

interface ConfirmPositionProps {
  handleBlowout: () => void
  handleGoBack: () => void
  isOnDevice: boolean
  currentStep: string
}

const ConfirmPosition = (props: ConfirmPositionProps): JSX.Element | null => {
  const { handleBlowout, handleGoBack, isOnDevice, currentStep } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const flowTitle = t('drop_tips')

  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={
        currentStep === POSITION_AND_BLOWOUT
          ? t('confirm_blowout_location', { flow: flowTitle })
          : t('confirm_drop_tip_location', { flow: flowTitle })
      }
      isSuccess={false}
    >
      {isOnDevice ? (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing4}
        >
          <SmallButton
            buttonType="alert"
            buttonText={
              currentStep === POSITION_AND_BLOWOUT
                ? i18n.format(t('blowout_liquid'), 'capitalize')
                : i18n.format(t('drop_tips'), 'capitalize')
            }
            onClick={handleBlowout}
            marginRight={SPACING.spacing4}
          />
          <SmallButton
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
        </Flex>
      ) : (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          paddingLeft={SPACING.spacing32}
        >
          <NeedHelpLink href={NEED_HELP_URL} />
          <Flex gridGap={SPACING.spacing8}>
            <SecondaryButton
              onClick={handleGoBack}
              marginRight={SPACING.spacing4}
            >
              {t('shared:go_back')}
            </SecondaryButton>
            <PrimaryButton onClick={handleBlowout}>
              {currentStep === POSITION_AND_BLOWOUT
                ? i18n.format(t('blowout_liquid'), 'capitalize')
                : i18n.format(t('drop_tips'), 'capitalize')}
            </PrimaryButton>
          </Flex>
        </Flex>
      )}
    </SimpleWizardBody>
  )
}

interface JogToPositionProps {
  handleGoBack: () => void
  handleJog: Jog
  handleProceed: () => void
  body: string
  isRobotMoving: boolean
  chainRunCommands: any
  currentStep: string
  createdMaintenanceRunId: string | null
  pipetteId: string
  instrumentModelSpecs: PipetteModelSpecs
  isOnDevice: boolean
}

export const JogToPosition = (
  props: JogToPositionProps
): JSX.Element | null => {
  const {
    handleGoBack,
    handleJog,
    handleProceed,
    body,
    isRobotMoving,
    currentStep,
    isOnDevice,
  } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const [showFullJogControls, setShowFullJogControls] = React.useState(false)
  const [
    showPositionConfirmation,
    setShowPositionConfirmation,
  ] = React.useState(false)

  if (showPositionConfirmation) {
    return isRobotMoving ? (
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
        handleBlowout={handleProceed}
        handleGoBack={() => setShowPositionConfirmation(false)}
        isOnDevice={isOnDevice}
        currentStep={currentStep}
      />
    )
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
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
          {body}
        </Flex>
        <Flex flex="1" alignItems={ALIGN_CENTER} gridGap={SPACING.spacing20}>
          <img width="89px" height="145px" />
        </Flex>
      </Flex>
      {isOnDevice ? (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            buttonType="tertiaryLowLight"
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <SmallButton
              buttonType="secondary"
              buttonText={t('move_pipette')}
              onClick={() => {
                setShowFullJogControls(true)
              }}
            />
            <SmallButton
              buttonText={t('shared:confirm_position')}
              onClick={() => setShowPositionConfirmation(true)}
            />
          </Flex>
          <Portal level="top">
            {showFullJogControls ? (
              <LegacyModalShell
                width="60rem"
                height="33.5rem"
                padding={SPACING.spacing32}
                display="flex"
                flexDirection={DIRECTION_COLUMN}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                header={
                  <StyledText
                    as="h4"
                    css={css`
                      font-weight: ${TYPOGRAPHY.fontWeightBold};
                      font-size: ${TYPOGRAPHY.fontSize28};
                      line-height: ${TYPOGRAPHY.lineHeight36};
                    `}
                  >
                    {t('move_to_a1_position')}
                  </StyledText>
                }
                footer={
                  <SmallButton
                    width="100%"
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                    buttonText={t('shared:close')}
                    onClick={() => {
                      setShowFullJogControls(false)
                    }}
                  />
                }
              >
                <JogControls jog={handleJog} isOnDevice={true} />
              </LegacyModalShell>
            ) : null}
          </Portal>
        </Flex>
      ) : (
        <>
          <JogControls jog={handleJog} />
          <Flex
            width="100%"
            marginTop={SPACING.spacing32}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <NeedHelpLink href={NEED_HELP_URL} />
            <Flex gridGap={SPACING.spacing8}>
              <SecondaryButton onClick={handleGoBack}>
                {t('shared:go_back')}
              </SecondaryButton>
              <PrimaryButton onClick={() => setShowPositionConfirmation(true)}>
                {t('shared:confirm_position')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </>
      )}
    </Flex>
  )
}
