import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TEXT_ALIGN_CENTER, COLORS } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import attachProbe from '../../assets/images/change-pip/attach-stem.png'
import pipetteCalibrating from '../../assets/images/change-pip/pipette-is-calibrating.png'
import type { PipetteWizardStepProps } from './types'

interface AttachProbeProps extends PipetteWizardStepProps {
  isExiting: boolean
}

export const AttachProbe = (props: AttachProbeProps): JSX.Element | null => {
  const {
    proceed,
    attachedPipette,
    chainRunCommands,
    mount,
    isRobotMoving,
    goBack,
    isExiting,
    errorMessage,
    setShowErrorMessage,
  } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const pipetteId = attachedPipette[mount]?.id
  //  hard coding calibration slot number for now in case it changes
  //  in the future
  const calSlotNum = '2'
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

  const pipetteCalibratingImage = (
    <Flex marginTop="-7.6rem" height="10.2rem">
      <img src={pipetteCalibrating} alt="Pipette is calibrating" />
    </Flex>
  )

  if (isRobotMoving)
    return (
      <InProgressModal
        alternativeSpinner={isExiting ? null : pipetteCalibratingImage}
        description={t('pipette_calibrating')}
      >
        {isExiting ? undefined : (
          <Flex marginX="8.5625rem">
            <StyledText as="p" textAlign={TEXT_ALIGN_CENTER}>
              {t('calibration_probe_touching', { slotNumber: calSlotNum })}
            </StyledText>
          </Flex>
        )}
      </InProgressModal>
    )
  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.errorEnabled}
      header={t('error_encountered')}
      subHeader={errorMessage}
    />
  ) : (
    <GenericWizardTile
      header={t('attach_probe')}
      //  TODO(Jr, 10/26/22): replace image with correct one!
      rightHandBody={<img src={attachProbe} width="100%" alt="Attach probe" />}
      bodyText={<StyledText as="p">{t('install_probe')}</StyledText>}
      proceedButtonText={t('initiate_calibration')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
