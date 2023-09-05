import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { RESPONSIVENESS, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { css } from 'styled-components'
import { StyledText } from '../../atoms/text'
import { RobotMotionLoader } from './RobotMotionLoader'
import {
  CompletedProtocolAnalysis,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import detachProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'
import { useChainRunCommands } from '../../resources/runs/hooks'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'

import type { Jog } from '../../molecules/JogControls/types'
import type {
  DetachProbeStep,
  RegisterPositionAction,
  WorkingOffset,
} from './types'
import type { LabwareOffset } from '@opentrons/api-client'

interface DetachProbeProps extends DetachProbeStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  registerPosition: React.Dispatch<RegisterPositionAction>
  chainRunCommands: ReturnType<typeof useChainRunCommands>['chainRunCommands']
  setFatalError: (errorMessage: string) => void
  workingOffsets: WorkingOffset[]
  existingOffsets: LabwareOffset[]
  handleJog: Jog
  isRobotMoving: boolean
}
export const DetachProbe = (props: DetachProbeProps): JSX.Element | null => {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const {
    pipetteId,
    protocolData,
    proceed,
    chainRunCommands,
    isRobotMoving,
    setFatalError,
  } = props

  const pipette = protocolData.pipettes.find(p => p.id === pipetteId)
  const pipetteName = pipette?.pipetteName
  const pipetteChannels =
    pipetteName != null ? getPipetteNameSpecs(pipetteName)?.channels ?? 1 : 1
  const pipetteMount = pipette?.mount
  if (pipetteName == null || pipetteMount == null) return null

  const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
    pipetteMount === 'left' ? 'leftZ' : 'rightZ'

  const handleProbeDetached = (): void => {
    chainRunCommands(
      [
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: pipetteZMotorAxis,
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'x' },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'y' },
        },
      ],
      false
    )
      .then(() => proceed())
      .catch((e: Error) => {
        setFatalError(
          `DetachProbe failed to move to safe location after probe attach with message: ${e.message}`
        )
      })
  }

  if (isRobotMoving)
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )

  return (
    <GenericWizardTile
      header={i18n.format(t('detach_probe'), 'capitalize')}
      //  todo(jr, 5/30/23): update animations! these are not final for 1, 8 and 96
      rightHandBody={
        <video
          css={css`
            padding-top: ${SPACING.spacing4};
            width: 100%;
            min-height: 18rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
        >
          <source src={pipetteChannels > 1 ? detachProbe8 : detachProbe1} />
        </video>
      }
      bodyText={
        <StyledText css={BODY_STYLE}>
          {i18n.format(t('remove_probe'), 'capitalize')}
        </StyledText>
      }
      proceedButtonText={t('confirm_detached')}
      proceed={handleProbeDetached}
    />
  )
}

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
