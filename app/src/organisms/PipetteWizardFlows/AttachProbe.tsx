import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  AnimationVideo,
  Banner,
  COLORS,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import pipetteProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Probing_1.webm'
import pipetteProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Probing_8.webm'
import probing96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Probing_96.webm'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { BODY_STYLE, FLOWS, SECTIONS } from './constants'
import { ProbeNotAttached } from './ProbeNotAttached'
import {
  getPipetteAnimations,
  isWasteChuteOnDeck,
  startCalibrationOnClick,
} from './utils'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { PipetteWizardStepProps } from './types'

interface AttachProbeProps extends PipetteWizardStepProps {
  isExiting: boolean
  deckConfig: UseQueryResult<DeckConfiguration>
}

const IN_PROGRESS_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  text-align: ${TYPOGRAPHY.textAlignCenter};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: ${TYPOGRAPHY.fontSize28};
    line-height: 1.625rem;
    margin-top: ${SPACING.spacing4};
  }
`

export const AttachProbe = (props: AttachProbeProps): JSX.Element | null => {
  const {
    attachedPipettes,
    mount,
    isRobotMoving,
    goBack,
    proceed,
    isExiting,
    errorMessage,
    isOnDevice,
    flowType,
    deckConfig,
    isDoorOpenError,
    dismissDoorOpenError,
  } = props

  const handleOnClick = (): void => {
    proceed()
  }

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const pipetteWizardStep = { mount, flowType, section: SECTIONS.ATTACH_PROBE }
  const [showUnableToDetect, setShowUnableToDetect] = useState<boolean>(false)
  const pipetteId = attachedPipettes[mount]?.serialNumber
  if (pipetteId == null) return null
  const displayName = attachedPipettes[mount]?.displayName
  const is8Channel = attachedPipettes[mount]?.data.channels === 8
  const is96Channel = attachedPipettes[mount]?.data.channels === 96
  const startCalibration = startCalibrationOnClick(
    props,
    setShowUnableToDetect,
    pipetteId,
    t('door_is_open') as string
  )

  const calSlotNum = 'C2'
  let src = pipetteProbe1
  if (is8Channel) {
    src = pipetteProbe8
  } else if (is96Channel) {
    src = probing96
  }
  let probeLocation = ''
  if (is8Channel) {
    probeLocation = t('backmost')
  } else if (is96Channel) {
    probeLocation = t('ninety_six_probe_location')
  }

  const pipetteProbeVid = (
    <Flex height="10.2rem" paddingTop={SPACING.spacing4}>
      <AnimationVideo
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        data-testid={src}
      >
        <source src={src} />
      </AnimationVideo>
    </Flex>
  )

  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        alternativeSpinner={isExiting ? null : pipetteProbeVid}
        description={
          isExiting
            ? t('stand_back')
            : t('pipette_calibrating', {
                pipetteName: displayName,
              })
        }
      >
        {isExiting ? undefined : (
          <Flex marginX={Boolean(isOnDevice) ? '4.5rem' : '8.5625rem'}>
            <LegacyStyledText css={IN_PROGRESS_STYLE}>
              {t('calibration_probe_touching', { slotNumber: calSlotNum })}
            </LegacyStyledText>
          </Flex>
        )}
      </SimpleWizardInProgressBody>
    )
  } else if (showUnableToDetect) {
    return (
      <ProbeNotAttached
        handleOnClick={
          is96Channel && isWasteChuteOnDeck(deckConfig)
            ? handleOnClick
            : startCalibration
        }
        setShowUnableToDetect={setShowUnableToDetect}
        isOnDevice={isOnDevice ?? false}
      />
    )
  }

  return errorMessage != null ? (
    isDoorOpenError ? (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('door_is_open')}
        subHeader={t('close_door_and_try_again')}
      >
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={Boolean(isOnDevice) ? ALIGN_CENTER : ALIGN_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          {Boolean(isOnDevice) ? (
            <SmallButton
              buttonText={t('try_again')}
              onClick={dismissDoorOpenError}
            />
          ) : (
            <PrimaryButton onClick={dismissDoorOpenError}>
              {t('try_again')}
            </PrimaryButton>
          )}
        </Flex>
      </SimpleWizardBody>
    ) : (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.red50}
        header={t('shared:error_encountered')}
        subHeader={
          <Trans
            t={t}
            i18nKey={'return_probe_error'}
            values={{ error: errorMessage }}
            components={{
              block: <LegacyStyledText forwardedAs="p" />,
              bold: (
                <LegacyStyledText
                  forwardedAs="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                />
              ),
            }}
          />
        }
      />
    )
  ) : (
    <GenericWizardTile
      header={i18n.format(t('attach_probe'), 'capitalize')}
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel: attachedPipettes[mount]?.data.channels,
      })}
      bodyText={
        <>
          <LegacyStyledText css={BODY_STYLE}>
            <Trans
              t={t}
              i18nKey={'install_probe'}
              values={{ location: probeLocation }}
              components={{
                bold: <strong />,
              }}
            />
          </LegacyStyledText>
          {is96Channel && !isWasteChuteOnDeck(deckConfig) && (
            <Banner
              type="warning"
              size={isOnDevice ? '1.5rem' : '1rem'}
              marginTop={isOnDevice ? SPACING.spacing24 : SPACING.spacing16}
            >
              {t('waste_chute_warning_probe')}
            </Banner>
          )}
        </>
      }
      proceedButtonText={
        is96Channel && isWasteChuteOnDeck(deckConfig)
          ? t('shared:continue')
          : t('begin_calibration')
      }
      proceed={
        is96Channel && isWasteChuteOnDeck(deckConfig)
          ? handleOnClick
          : startCalibration
      }
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
    />
  )
}
