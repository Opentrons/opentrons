import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  DIRECTION_COLUMN,
  Flex,
  InlineNotification,
  SPACING,
  StyledText,
} from '@opentrons/components'

import pipetteProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Probing_1.webm'
import pipetteProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Probing_8.webm'
import probing96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Probing_96.webm'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'

import { FLOWS, SECTIONS } from './constants'
import { getPipetteAnimations } from './utils'

import type { PipetteWizardStepProps } from './types'

interface AttachProbeProps extends PipetteWizardStepProps {
  isExiting: boolean
  showWasteChuteWarning?: boolean
}

export const AttachProbe = (props: AttachProbeProps): JSX.Element | null => {
  const {
    attachedPipettes,
    mount,
    isRobotMoving,
    goBack,
    proceed,
    isExiting,
    flowType,
    selectedSlot,
    showWasteChuteWarning = false,
  } = props

  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const pipetteWizardStep = { mount, flowType, section: SECTIONS.ATTACH_PROBE }
  const pipetteId = attachedPipettes[mount]?.serialNumber
  if (pipetteId == null) return null
  const displayName = attachedPipettes[mount]?.displayName
  const is8Channel = attachedPipettes[mount]?.data.channels === 8
  const is96Channel = attachedPipettes[mount]?.data.channels === 96

  const calSlotNum = selectedSlot
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
        body={
          isExiting
            ? undefined
            : t('calibration_probe_touching', { slotNumber: calSlotNum })
        }
      />
    )
  }

  return (
    <GenericWizardTile
      header={
        <StyledText
          desktopStyle="headingSmallBold"
          oddStyle="level4HeaderSemiBold"
        >
          {i18n.format(t('attach_probe'), 'capitalize')}
        </StyledText>
      }
      rightHandBody={getPipetteAnimations({
        pipetteWizardStep,
        channel: attachedPipettes[mount]?.data.channels,
      })}
      bodyText={
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="bodyTextRegular"
          >
            <Trans
              t={t}
              i18nKey={'install_probe'}
              values={{ location: probeLocation }}
              components={{
                bold: <strong />,
              }}
            />
          </StyledText>
          {showWasteChuteWarning ? (
            <InlineNotification
              type="alert"
              message={t('waste_chute_96_channel_must_use_b2')}
            />
          ) : null}
        </Flex>
      }
      proceedButtonText={t('continue')}
      proceed={proceed}
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
    />
  )
}
