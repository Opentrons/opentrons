import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  Banner,
  Flex,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LEFT, WASTE_CHUTE_FIXTURES } from '@opentrons/shared-data'

import attachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import attachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_96.webm'
import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils/isDoorOpenError'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'

import { getFixtureIdByCutoutId } from './getFixtureIdByCutoutId'

import type { ReactNode } from 'react'
import type { CreateCommand, DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardRequiresPipetteStepProps } from './types'

interface AttachProbeProps extends ModuleSetupWizardRequiresPipetteStepProps {
  adapterId: string | null
  deckConfig: DeckConfiguration
}

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export function AttachProbe(props: AttachProbeProps): ReactNode {
  const {
    proceed,
    goBack,
    chainRunCommands,
    setErrorMessage,
    setIsDoorOpenError,
    adapterId,
    isRobotMoving,
    attachedModule,
    attachedPipette,
    isOnDevice,
    deckConfig,
  } = props
  const { t, i18n } = useTranslation([
    'module_wizard_flows',
    'pipette_wizard_flows',
  ])
  const fixtureIdByCutoutId = getFixtureIdByCutoutId(attachedModule, deckConfig)
  const attachedPipetteChannels = attachedPipette.data.channels
  const mount = attachedPipette.mount
  const pipetteAttachProbeVideoSource = ((): string => {
    switch (attachedPipetteChannels) {
      case 8:
        return attachProbe8
      case 96:
        return attachProbe96
      case 1:
      default:
        return attachProbe1
    }
  })()
  const probeLocation = ((): string => {
    switch (attachedPipetteChannels) {
      case 8:
        return `${t('pipette_wizard_flows:backmost')} (${mount} mount)`
      case 96:
        return t('pipette_wizard_flows:ninety_six_probe_location')
      case 1:
      default:
        return `${mount} mount`
    }
  })()
  const wasteChuteConflictWith96Channel =
    'cutoutC3' in fixtureIdByCutoutId && attachedPipette.data.channels === 96
  const isWasteChuteOnDeck = deckConfig.some(cc =>
    WASTE_CHUTE_FIXTURES.includes(cc.cutoutFixtureId)
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
        if (isMaintenanceDoorOpenError(e)) {
          setIsDoorOpenError(true)
          setErrorMessage(t('module_wizard_flows:door_is_open') as string)
        } else {
          setErrorMessage(`error starting module calibration: ${e.message}`)
        }
      })
  }

  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        // TODO ND: 9/6/23 use spinner until animations are made
        alternativeSpinner={null}
        description={t('stand_back')}
      />
    )
  }
  // TODO: add calibration loading screen and error screen
  return (
    <GenericWizardTile
      header={i18n.format(t('attach_probe'), 'capitalize')}
      rightHandBody={
        <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
          <AnimationVideo
            css={css`
              max-width: 100%;
              max-height: 100%;
            `}
          >
            <source src={pipetteAttachProbeVideoSource} />
          </AnimationVideo>
        </Flex>
      }
      bodyText={
        <>
          <LegacyStyledText css={BODY_STYLE}>
            <Trans
              t={t}
              i18nKey="pipette_wizard_flows:install_probe"
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
      }
      proceedButtonText={t('begin_calibration')}
      proceed={handleBeginCalibration}
      back={goBack}
    />
  )
}
