import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { Flex, JUSTIFY_CENTER } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import attach96Pipette from '../../assets/images/change-pip/attach-96-pipette.png'
import { Skeleton } from '../../atoms/Skeleton'
import { CheckPipetteButton } from './CheckPipetteButton'
import { BODY_STYLE } from './constants'
import type { PipetteWizardStepProps } from './types'

interface MountPipetteProps extends PipetteWizardStepProps {
  isPending: boolean
  setPending: React.Dispatch<React.SetStateAction<boolean>>
}
const BACKGROUND_SIZE = '47rem'

export const MountPipette = (props: MountPipetteProps): JSX.Element => {
  const {
    proceed,
    goBack,
    selectedPipette,
    isPending,
    setPending,
    isOnDevice,
  } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const isSingleMountPipette = selectedPipette === SINGLE_MOUNT_PIPETTES
  const bodyTextSkeleton = (
    <Skeleton
      width="18rem"
      height="1.125rem"
      backgroundSize={BACKGROUND_SIZE}
    />
  )
  let bodyText: React.ReactNode = <div></div>
  if (isPending) {
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
      <StyledText css={BODY_STYLE}> {t('hold_pipette_carefully')}</StyledText>
    )
  }

  return (
    <GenericWizardTile
      header={
        isPending ? (
          <Skeleton
            width="17rem"
            height="1.75rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : (
          t(
            isSingleMountPipette
              ? 'connect_and_screw_in_pipette'
              : 'connect_96_channel'
          )
        )
      }
      rightHandBody={
        isPending ? (
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
      backIsDisabled={isPending}
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          isOnDevice={isOnDevice}
          isDisabled={isPending}
          proceed={proceed}
          proceedButtonText={t('continue')}
          setPending={setPending}
        />
      }
    />
  )
}
