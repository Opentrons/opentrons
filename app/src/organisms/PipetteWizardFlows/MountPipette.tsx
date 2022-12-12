import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { Flex, JUSTIFY_CENTER, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import screwPattern from '../../assets/images/change-pip/screw-pattern.png'
import attach96Pipette from '../../assets/images/change-pip/attach-96-pipette.png'
import { Skeleton } from '../../atoms/Skeleton'
import { CheckPipetteButton } from './CheckPipetteButton'
import type { PipetteWizardStepProps } from './types'

const BACKGROUND_SIZE = '47rem'

export const MountPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { proceed, goBack, robotName, selectedPipette } = props
  const { t } = useTranslation('pipette_wizard_flows')
  const isSingleMountPipette = selectedPipette === SINGLE_MOUNT_PIPETTES
  const [isPending, setPending] = React.useState<boolean>(false)
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
  } else if (isSingleMountPipette && !isPending) {
    bodyText = (
      <Trans
        t={t}
        i18nKey="hold_onto_pipette"
        components={{
          block: <StyledText as="p" marginBottom={SPACING.spacing4} />,
        }}
      />
    )
  } else if (!isSingleMountPipette && !isPending) {
    bodyText = <StyledText as="p"> {t('hold_pipette_carefully')}</StyledText>
  }

  return (
    <GenericWizardTile
      header={t(
        isSingleMountPipette
          ? 'connect_and_screw_in_pipette'
          : 'connect_96_channel'
      )}
      rightHandBody={
        isPending ? (
          <Skeleton
            width="171px"
            height="248px"
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
      back={goBack}
      proceedButton={
        isPending ? (
          <Skeleton
            width="5.6rem"
            height="2.375rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : (
          <CheckPipetteButton
            proceed={proceed}
            robotName={robotName}
            proceedButtonText={t('continue')}
            setPending={setPending}
          />
        )
      }
    />
  )
}
