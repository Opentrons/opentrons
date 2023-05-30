import * as React from 'react'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  TYPOGRAPHY,
  SPACING,
  RESPONSIVENESS,
} from '@opentrons/components'
import { NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { CalibrationErrorModal } from './CalibrationErrorModal'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import pipetteProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Probing_1.webm'
import pipetteProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Probing_8.webm'
import { BODY_STYLE, SECTIONS, FLOWS } from './constants'
import { getPipetteAnimations } from './utils'
import type { PipetteWizardStepProps } from './types'

interface AttachProbeProps extends PipetteWizardStepProps {
  isExiting: boolean
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
    proceed,
    attachedPipettes,
    chainRunCommands,
    mount,
    isRobotMoving,
    goBack,
    isExiting,
    setShowErrorMessage,
    errorMessage,
    isOnDevice,
    selectedPipette,
    flowType,
  } = props
  const { t, i18n } = useTranslation('pipette_wizard_flows')
  const pipetteWizardStep = { mount, flowType, section: SECTIONS.ATTACH_PROBE }
  const pipetteId = attachedPipettes[mount]?.serialNumber
  const displayName = attachedPipettes[mount]?.displayName
  const is8Channel = attachedPipettes[mount]?.data.channels === 8
  const calSlotNum = 'C2'

  if (pipetteId == null) return null
  const handleOnClick = (): void => {
    chainRunCommands(
      [
        {
          // @ts-expect-error calibration type not yet supported
          commandType: 'calibration/calibratePipette' as const,
          params: {
            mount: mount,
          },
        },
        {
          // @ts-expect-error calibration type not yet supported
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: mount,
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }

  const pipetteProbeVid = (
    <Flex height="10.2rem" paddingTop={SPACING.spacing4}>
      <video
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
        data-testid={is8Channel ? pipetteProbe8 : pipetteProbe1}
      >
        <source src={is8Channel ? pipetteProbe8 : pipetteProbe1} />
      </video>
    </Flex>
  )

  if (isRobotMoving)
    return (
      <InProgressModal
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
          <Flex marginX={isOnDevice ? '4.5rem' : '8.5625rem'}>
            <StyledText css={IN_PROGRESS_STYLE}>
              {t('calibration_probe_touching', { slotNumber: calSlotNum })}
            </StyledText>
          </Flex>
        )}
      </InProgressModal>
    )

  return errorMessage != null ? (
    <CalibrationErrorModal
      proceed={proceed}
      isOnDevice={isOnDevice}
      errorMessage={errorMessage}
      chainRunCommands={chainRunCommands}
      mount={mount}
      setShowErrorMessage={setShowErrorMessage}
    />
  ) : (
    <GenericWizardTile
      header={i18n.format(t('attach_probe'), 'capitalize')}
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel: is8Channel ? 8 : 1,
      })}
      bodyText={
        is8Channel || selectedPipette === NINETY_SIX_CHANNEL ? (
          <Trans
            t={t}
            i18nKey={
              is8Channel
                ? 'install_probe_8_channel'
                : 'install_probe_96_channel'
            }
            components={{
              strong: <strong />,
              block: <StyledText css={BODY_STYLE} />,
            }}
          />
        ) : (
          <StyledText css={BODY_STYLE}>{t('install_probe')}</StyledText>
        )
      }
      proceedButtonText={t('begin_calibration')}
      proceed={handleOnClick}
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
    />
  )
}
