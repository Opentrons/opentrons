import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  Banner,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LEFT, WASTE_CHUTE_FIXTURES } from '@opentrons/shared-data'
import attachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import attachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_96.webm'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'

import type {
  CreateCommand,
  DeckConfiguration,
  CutoutId,
  CutoutFixtureId,
} from '@opentrons/shared-data'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import type { ModuleCalibrationWizardStepProps } from './types'
interface AttachProbeProps extends ModuleCalibrationWizardStepProps {
  adapterId: string | null
  deckConfig: DeckConfiguration
  fixtureIdByCutoutId: { [cutoutId in CutoutId]?: CutoutFixtureId }
}

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
    isOnDevice,
    deckConfig,
    fixtureIdByCutoutId,
  } = props
  const { t, i18n } = useTranslation([
    'module_wizard_flows',
    'pipette_wizard_flows',
  ])

  const attachedPipetteChannels = attachedPipette.data.channels
  let pipetteAttachProbeVideoSource, probeLocation
  switch (attachedPipetteChannels) {
    case 1:
      pipetteAttachProbeVideoSource = attachProbe1
      probeLocation = ''
      break
    case 8:
      pipetteAttachProbeVideoSource = attachProbe8
      probeLocation = t('pipette_wizard_flows:backmost')
      break
    case 96:
      pipetteAttachProbeVideoSource = attachProbe96
      probeLocation = t('pipette_wizard_flows:ninety_six_probe_location')
      break
  }
  const wasteChuteConflictWith96Channel =
    'cutoutC3' in fixtureIdByCutoutId && attachedPipette.data.channels === 96
  const isWasteChuteOnDeck = deckConfig.some(cc =>
    WASTE_CHUTE_FIXTURES.includes(cc.cutoutFixtureId)
  )

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

  const bodyText = (
    <>
      <LegacyStyledText css={BODY_STYLE}>
        <Trans
          t={t}
          i18nKey={'pipette_wizard_flows:install_probe'}
          values={{ location: probeLocation }}
          components={{
            bold: <strong />,
          }}
        />
      </LegacyStyledText>

      {wasteChuteConflictWith96Channel && (
        <Banner
          type={isWasteChuteOnDeck ? 'error' : 'warning'}
          size={isOnDevice ? '1.5rem' : '1rem'}
          marginTop={isOnDevice ? SPACING.spacing24 : SPACING.spacing16}
        >
          {isWasteChuteOnDeck
            ? t('pipette_wizard_flows:waste_chute_error')
            : t('pipette_wizard_flows:waste_chute_warning')}
        </Banner>
      )}
    </>
  )

  const handleBeginCalibration = (): void => {
    if (adapterId == null) {
      setErrorMessage('calibration adapter has not been loaded yet')
      return
    }
    const homeCommands: CreateCommand[] = [
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
    ]

    chainRunCommands?.(homeCommands, false)
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setErrorMessage(`error starting module calibration: ${e.message}`)
      })
  }

  if (isRobotMoving)
    return (
      <SimpleWizardInProgressBody
        // TODO ND: 9/6/23 use spinner until animations are made
        alternativeSpinner={null}
        description={t('stand_back')}
      />
    )
  // TODO: add calibration loading screen and error screen
  else
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
