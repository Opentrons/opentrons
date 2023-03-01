import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  TEXT_ALIGN_CENTER,
  TYPOGRAPHY,
  COLORS,
  SPACING,
} from '@opentrons/components'
import { ODD_MEDIA_QUERY_SPECS } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import attachProbe from '../../assets/images/change-pip/attach-stem.png'
import pipetteCalibrating from '../../assets/images/change-pip/pipette-is-calibrating.png'
import { BODY_STYLE } from './constants'
import type { PipetteWizardStepProps } from './types'

interface AttachProbeProps extends PipetteWizardStepProps {
  isExiting: boolean
}

const IN_PROGRESS_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  text-align: ${TEXT_ALIGN_CENTER};

  @media ${ODD_MEDIA_QUERY_SPECS} {
    font-size: 1.75rem;
    line-height: 1.625rem;
    margin-top: ${SPACING.spacing2};
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
    errorMessage,
    setShowErrorMessage,
    isOnDevice,
  } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const pipetteId = attachedPipettes[mount]?.id
  const displayName = attachedPipettes[mount]?.modelSpecs.displayName
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
    <Flex marginTop={isOnDevice ? '-5rem' : '-7.6rem'} height="10.2rem">
      <img src={pipetteCalibrating} alt="Pipette is calibrating" />
    </Flex>
  )

  if (isRobotMoving)
    return (
      <InProgressModal
        alternativeSpinner={isExiting ? null : pipetteCalibratingImage}
        description={t('pipette_calibrating', {
          //  todo(jr 2/28/23): insert short pipette name const when we know how to get it
          pipetteName: displayName,
        })}
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
      bodyText={<StyledText css={BODY_STYLE}>{t('install_probe')}</StyledText>}
      proceedButtonText={t('begin_calibration')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
