import * as React from 'react'
import { css } from 'styled-components'
import { Trans, useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LEFT, WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'
import { Banner } from '../../atoms/Banner'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '../../molecules/SimpleWizardBody'
import pipetteProbe1 from '../../assets/videos/pipette-wizard-flows/Pipette_Probing_1.webm'
import pipetteProbe8 from '../../assets/videos/pipette-wizard-flows/Pipette_Probing_8.webm'
import probing96 from '../../assets/videos/pipette-wizard-flows/Pipette_Probing_96.webm'
import { BODY_STYLE, SECTIONS, FLOWS } from './constants'
import { getPipetteAnimations } from './utils'
import { ProbeNotAttached } from './ProbeNotAttached'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import type { MotorAxes, CreateCommand } from '@opentrons/shared-data'
import type { PipetteWizardStepProps } from './types'

interface AttachProbeProps extends PipetteWizardStepProps {
  isExiting: boolean
}

const IN_PROGRESS_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  text-align: ${TYPOGRAPHY.textAlignCenter};

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
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
    flowType,
  } = props
  const { t, i18n } = useTranslation('pipette_wizard_flows')
  const pipetteWizardStep = { mount, flowType, section: SECTIONS.ATTACH_PROBE }
  const [showUnableToDetect, setShowUnableToDetect] = React.useState<boolean>(
    false
  )

  const pipetteId = attachedPipettes[mount]?.serialNumber
  const displayName = attachedPipettes[mount]?.displayName
  const is8Channel = attachedPipettes[mount]?.data.channels === 8
  const is96Channel = attachedPipettes[mount]?.data.channels === 96
  const calSlotNum = 'C2'
  const axes: MotorAxes = mount === LEFT ? ['leftZ'] : ['rightZ']
  const deckConfig = useNotifyDeckConfigurationQuery().data
  const isWasteChuteOnDeck =
    deckConfig?.find(fixture => fixture.cutoutId === WASTE_CHUTE_CUTOUT) ??
    false

  if (pipetteId == null) return null
  const handleOnClick = (): void => {
    const verifyCommands: CreateCommand[] = [
      {
        commandType: 'verifyTipPresence',
        params: {
          pipetteId,
          expectedState: 'present',
          followSingularSensor: 'primary',
        },
      },
    ]
    const homeCommands: CreateCommand[] = [
      {
        commandType: 'home' as const,
        params: {
          axes,
        },
      },
      {
        commandType: 'home' as const,
        params: {
          skipIfMountPositionOk: mount,
        },
      },
      {
        commandType: 'calibration/calibratePipette' as const,
        params: {
          mount,
        },
      },
      {
        commandType: 'calibration/moveToMaintenancePosition' as const,
        params: {
          mount,
        },
      },
    ]
    chainRunCommands?.(verifyCommands, false)
      .then(() => {
        chainRunCommands?.(homeCommands, false)
          .then(() => {
            proceed()
          })
          .catch(error => {
            setShowErrorMessage(error.message as string)
          })
      })
      .catch((e: Error) => {
        setShowUnableToDetect(true)
      })
  }

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
      <video
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
        data-testid={src}
      >
        <source src={src} />
      </video>
    </Flex>
  )

  if (isRobotMoving)
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
  else if (showUnableToDetect)
    return (
      <ProbeNotAttached
        handleOnClick={handleOnClick}
        setShowUnableToDetect={setShowUnableToDetect}
        isOnDevice={isOnDevice ?? false}
      />
    )

  return errorMessage != null ? (
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
            block: <LegacyStyledText as="p" />,
            bold: (
              <LegacyStyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              />
            ),
          }}
        />
      }
    />
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
          {is96Channel && (
            <Banner
              type={Boolean(isWasteChuteOnDeck) ? 'error' : 'warning'}
              size={Boolean(isOnDevice) ? '1.5rem' : '1rem'}
              marginTop={
                Boolean(isOnDevice) ? SPACING.spacing24 : SPACING.spacing16
              }
            >
              {Boolean(isWasteChuteOnDeck)
                ? t('waste_chute_error')
                : t('waste_chute_warning')}
            </Banner>
          )}
        </>
      }
      proceedButtonText={t('begin_calibration')}
      proceed={handleOnClick}
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
    />
  )
}
