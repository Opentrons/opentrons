import * as React from 'react'
import { css } from 'styled-components'
import attachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import attachProbe96 from '../../assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_96.webm'
import { Trans, useTranslation } from 'react-i18next'
import {
  LEFT,
  THERMOCYCLER_MODULE_MODELS,
} from '@opentrons/shared-data/js/constants'
import { getModuleDisplayName } from '@opentrons/shared-data/js/modules'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import {
  Flex,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'

import type { ModuleCalibrationWizardStepProps } from './types'
interface AttachProbeProps extends ModuleCalibrationWizardStepProps {
  isExiting: boolean
  adapterId: string | null
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
const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const AttachProbe = (props: AttachProbeProps): JSX.Element | null => {
  const {
    proceed,
    goBack,
    chainRunCommands,
    setErrorMessage,
    adapterId,
    isRobotMoving,
    attachedModule,
    attachedPipette,
    isExiting,
    isOnDevice,
    slotName,
  } = props
  const { t, i18n } = useTranslation('module_wizard_flows')

  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)

  const attachedPipetteChannels = attachedPipette.data.channels
  let pipetteAttachProbeVideoSource, i18nKey
  switch (attachedPipetteChannels) {
    case 1:
      pipetteAttachProbeVideoSource = attachProbe1
      i18nKey = 'install_probe'
      break
    case 8:
      pipetteAttachProbeVideoSource = attachProbe8
      i18nKey = 'install_probe_8_channel'
      break
    case 96:
      pipetteAttachProbeVideoSource = attachProbe96
      i18nKey = 'install_probe_96_channel'
      break
  }

  const pipetteAttachProbeVid = (
    <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
      <video
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
      >
        <source src={pipetteAttachProbeVideoSource} />
      </video>
    </Flex>
  )

  let moduleCalibratingDisplay
  if (
    THERMOCYCLER_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    moduleCalibratingDisplay = t('calibration_probe_touching', {
      module: moduleDisplayName,
      slotName: slotName,
    })
  } else {
    moduleCalibratingDisplay = t('calibration_probe_touching', {
      module: moduleDisplayName,
    })
  }

  if (isRobotMoving)
    return (
      <InProgressModal
        // TODO ND: 9/6/23 use spinner until animations are made
        alternativeSpinner={null}
        description={
          isExiting
            ? t('stand_back')
            : t('module_calibrating', {
                moduleName: moduleDisplayName,
              })
        }
      >
        {isExiting ? undefined : (
          <Flex marginX={isOnDevice ? '4.5rem' : '8.5625rem'}>
            <StyledText css={IN_PROGRESS_STYLE}>
              {moduleCalibratingDisplay}
            </StyledText>
          </Flex>
        )}
      </InProgressModal>
    )

  const bodyText =
    attachedPipetteChannels === 8 || attachedPipetteChannels === 96 ? (
      <Trans
        t={t}
        i18nKey={i18nKey}
        components={{
          strong: <strong />,
          block: <StyledText css={BODY_STYLE} />,
        }}
      />
    ) : (
      <StyledText css={BODY_STYLE}>{t('install_probe')}</StyledText>
    )

  const handleBeginCalibration = (): void => {
    if (adapterId == null) {
      setErrorMessage('calibration adapter has not been loaded yet')
      return
    }
    chainRunCommands?.(
      [
        {
          commandType: 'home' as const,
          params: {
            axes: attachedPipette.mount === LEFT ? ['leftZ'] : ['rightZ'],
          },
        },
        {
          commandType: 'calibration/calibrateModule',
          params: {
            moduleId: attachedModule.id,
            labwareId: adapterId,
            mount: attachedPipette.mount,
          },
        },
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: attachedPipette.mount,
          },
        },
      ],
      false
    )
      .then(() => proceed())
      .catch((e: Error) =>
        setErrorMessage(`error starting module calibration: ${e.message}`)
      )
  }

  // TODO: add calibration loading screen and error screen
  return (
    <GenericWizardTile
      header={i18n.format(t('attach_probe'), 'capitalize')}
      rightHandBody={pipetteAttachProbeVid}
      bodyText={bodyText}
      proceedButtonText={t('begin_calibration')}
      proceed={handleBeginCalibration}
      back={goBack}
    />
  )
}
