import * as React from 'react'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import capitalize from 'lodash/capitalize'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { Skeleton } from '../../atoms/Skeleton'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import detachPipette from '../../assets/images/change-pip/single-channel-detach-pipette.png'
import detach96Pipette from '../../assets/images/change-pip/detach-96-pipette.png'
import { CheckPipetteButton } from './CheckPipetteButton'
import type { PipetteWizardStepProps } from './types'

const BACKGROUND_SIZE = '47rem'

export const DetachPipette = (props: PipetteWizardStepProps): JSX.Element => {
  const { isRobotMoving, goBack, proceed, robotName, selectedPipette } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const isSingleMountPipette = selectedPipette === SINGLE_MOUNT_PIPETTES
  const [isPending, setPending] = React.useState<boolean>(false)

  let bodyText: React.ReactNode = <div></div>
  if (isPending) {
    bodyText = (
      <>
        <Skeleton
          width="18rem"
          height="1.125rem"
          backgroundSize={BACKGROUND_SIZE}
        />
        <Skeleton
          width="18rem"
          height="1.125rem"
          backgroundSize={BACKGROUND_SIZE}
        />
      </>
    )
  } else if (isSingleMountPipette && !isPending) {
    bodyText = <StyledText as="p">{t('hold_and_loosen')}</StyledText>
  } else if (!isSingleMountPipette && !isPending) {
    bodyText = (
      <Trans
        t={t}
        i18nKey="secure_pipette"
        components={{
          block: <StyledText as="p" marginBottom="1rem" />,
        }}
      />
    )
  }

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={t(
        isSingleMountPipette ? 'loose_detach' : 'unscrew_remove_96_channel'
      )}
      //  TODO(Jr, 11/8/22): replace image with correct one!
      rightHandBody={
        isPending ? (
          <Skeleton
            width="100%"
            height="14.375rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : (
          <img
            src={isSingleMountPipette ? detachPipette : detach96Pipette}
            width="100%"
            alt={
              isSingleMountPipette
                ? 'Detach pipette'
                : 'Unscrew 96 channel pipette'
            }
          />
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
            robotName={robotName}
            proceedButtonText={capitalize(t('shared:continue'))}
            proceed={proceed}
            setPending={setPending}
          />
        )
      }
    />
  )
}
