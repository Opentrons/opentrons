import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  AnimationVideo,
  LegacyStyledText,
  StyledText,
} from '@opentrons/components'

import detachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'
import detachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_96.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import {
  selectActivePipette,
  selectActivePipetteChannelCount,
  selectCurrentSubstep,
  selectSelectedLwOverview,
  selectSelectedLwWithOffsetDetailsMostRecentVectorOffset,
} from '/app/redux/protocol-runs'

import type { ReactNode } from 'react'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function DetachProbe(props: LPCWizardContentProps): ReactNode {
  const { proceedStep, goBackLastStep, commandUtils, runId } = props
  const { t } = useTranslation('labware_position_check')
  const { toggleRobotMoving, handleMoveToInitialOffsetPosition, home } =
    commandUtils

  const currentSubstep = useSelector(selectCurrentSubstep(runId))
  const pipette = useSelector(selectActivePipette(runId))!
  const pipetteId = pipette.id
  const selectedLwInfo = useSelector(selectSelectedLwOverview(runId))
  const mostRecentVectorOffset = useSelector(
    selectSelectedLwWithOffsetDetailsMostRecentVectorOffset(runId)
  )
  const offsetLocationDetails = selectedLwInfo?.offsetLocationDetails

  const handleGoBack = (): void => {
    void toggleRobotMoving(true)
      .then(() => {
        // On the desktop app, ensure the robot returns to the initial offset position instead of the home position
        // when actively calibrating an offset.
        if (
          currentSubstep === 'handle-lw/edit-offset/check-labware' &&
          offsetLocationDetails != null
        ) {
          return home()
            .then(() =>
              handleMoveToInitialOffsetPosition(
                offsetLocationDetails,
                pipetteId,
                mostRecentVectorOffset
              )
            )
            .then(() => Promise.resolve())
        } else {
          return home()
        }
      })
      .then(() => {
        goBackLastStep()
      })
      .then(() => toggleRobotMoving(false))
  }

  const channelCount = useSelector(selectActivePipetteChannelCount(props.runId))

  const probeVideo = (): string => {
    switch (channelCount) {
      case 1:
        return detachProbe1
      case 8:
        return detachProbe8
      case 96:
        return detachProbe96
      default: {
        console.error('Unexpected channel count.')
        return detachProbe1
      }
    }
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      desktopFooterBtnCopy={t('confirm_removal')}
      desktopHeaderBtnCopy={t('exit')}
      oddHeaderBtnCopy={t('confirm_removal')}
      onClickButton={() => {
        proceedStep()
      }}
      tertiaryBtnProps={{ onClick: handleGoBack, text: t('cancel') }}
      onClickBack={handleGoBack}
    >
      <TwoColumn>
        <DescriptionContent
          headline={t('detach_probe')}
          message={
            <StyledText
              oddStyle="bodyTextRegular"
              desktopStyle="bodyDefaultRegular"
            >
              <Trans
                t={t}
                i18nKey="store_probe"
                components={{ block: <LegacyStyledText forwardedAs="p" /> }}
              />
            </StyledText>
          }
        />
        <AnimationVideo
          css={VIDEO_STYLE}
          src={probeVideo()}
          data-testid="probe-video"
        />
      </TwoColumn>
    </LPCContentContainer>
  )
}

const VIDEO_STYLE = css`
  height: 100%;
  width: 100%;
`
