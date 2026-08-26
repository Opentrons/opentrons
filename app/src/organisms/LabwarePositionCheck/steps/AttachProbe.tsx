import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import { AnimationVideo, LegacyStyledText } from '@opentrons/components'

import attachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import attachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_96.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import {
  selectActivePipette,
  selectActivePipetteChannelCount,
} from '/app/redux/protocol-runs'

import type { ReactNode } from 'react'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function AttachProbe(props: LPCWizardContentProps): ReactNode {
  const { handleAttachProbeCheck, handleCloseWithoutHome } =
    props.commandUtils.headerCommands
  const { t } = useTranslation('labware_position_check')
  const channelCount = useSelector(selectActivePipetteChannelCount(props.runId))
  const activePipette = useSelector(selectActivePipette(props.runId))
  const mount = activePipette?.mount ?? 'left'

  const probeVideo = (): string => {
    switch (channelCount) {
      case 1:
        return attachProbe1
      case 8:
        return attachProbe8
      case 96:
        return attachProbe96
      default: {
        console.error('Unexpected channel count.')
        return attachProbe1
      }
    }
  }

  const probei18nString = (): string => {
    switch (channelCount) {
      case 1:
        return 'install_probe_1ch'
      case 8:
        return 'install_probe_8ch'
      case 96:
        return 'install_probe_96ch'
      default: {
        console.error('Unexpected channel count.')
        return 'install_probe_1ch'
      }
    }
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      onClickButton={handleAttachProbeCheck}
      oddHeaderBtnCopy={t('continue')}
      desktopFooterBtnCopy={t('continue')}
      desktopHeaderBtnCopy={t('exit')}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: handleCloseWithoutHome,
      }}
    >
      <TwoColumn>
        <DescriptionContent
          headline={t('attach_probe')}
          message={
            <Trans
              t={t}
              i18nKey={probei18nString()}
              values={{ mount }}
              components={{
                block: <LegacyStyledText forwardedAs="p" />,
                bold: <strong />,
                strong: <strong />,
              }}
            />
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
