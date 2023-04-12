import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  SINGLE_MOUNT_PIPETTES,
  WEIGHT_OF_96_CHANNEL,
} from '@opentrons/shared-data'
import { Flex, JUSTIFY_CENTER, SPACING, SIZE_1 } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import attach96Pipette from '../../assets/images/change-pip/attach-96-pipette.png'
import { Skeleton } from '../../atoms/Skeleton'
import { CheckPipetteButton } from './CheckPipetteButton'
import { BODY_STYLE } from './constants'
import type { PipetteWizardStepProps } from './types'

interface MountPipetteProps extends PipetteWizardStepProps {
  isFetching: boolean
  setFetching: React.Dispatch<React.SetStateAction<boolean>>
}
const BACKGROUND_SIZE = '47rem'

export const MountPipette = (props: MountPipetteProps): JSX.Element => {
  const {
    proceed,
    goBack,
    selectedPipette,
    isFetching,
    setFetching,
    isOnDevice,
  } = props
  const { t, i18n } = useTranslation('pipette_wizard_flows')
  const isSingleMountPipette = selectedPipette === SINGLE_MOUNT_PIPETTES
  const bodyTextSkeleton = (
    <Skeleton
      width="18rem"
      height="1.125rem"
      backgroundSize={BACKGROUND_SIZE}
    />
  )
  let bodyText: React.ReactNode = <div></div>
  if (isFetching) {
    bodyText = (
      <>
        {bodyTextSkeleton}
        {bodyTextSkeleton}
        {bodyTextSkeleton}
        {bodyTextSkeleton}
      </>
    )
  } else {
    bodyText = (
      <>
        {!isSingleMountPipette ? (
          <Banner
            type="warning"
            size={isOnDevice ? '1.5rem' : SIZE_1}
            marginY={SPACING.spacing2}
          >
            {t('pipette_heavy', { weight: WEIGHT_OF_96_CHANNEL })}
          </Banner>
        ) : null}
        <StyledText css={BODY_STYLE}> {t('hold_pipette_carefully')}</StyledText>
      </>
    )
  }

  return (
    <GenericWizardTile
      header={
        isFetching ? (
          <Skeleton
            width="17rem"
            height="1.75rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : (
          i18n.format(
            t(
              isSingleMountPipette
                ? 'connect_and_secure_pipette'
                : 'connect_96_channel'
            ),
            'capitalize'
          )
        )
      }
      rightHandBody={
        isFetching ? (
          <Skeleton
            width="10.6875rem"
            height="15.5rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : (
          <Flex justifyContent={JUSTIFY_CENTER}>
            <img
              //  TODO(jr, 11/18/22): attach real image
              src={isSingleMountPipette ? screwPattern : attach96Pipette}
              width="171px"
              height="248px"
              alt={
                isSingleMountPipette
                  ? 'Screw pattern'
                  : 'Attach 96 channel pipette'
              }
            />
          </Flex>
        )
      }
      bodyText={bodyText}
      backIsDisabled={isFetching}
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          isOnDevice={isOnDevice}
          proceed={proceed}
          proceedButtonText={t('continue')}
          setFetching={setFetching}
          isFetching={isFetching}
        />
      }
    />
  )
}
