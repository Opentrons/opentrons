import * as React from 'react'
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

interface DetachPipetteProps extends PipetteWizardStepProps {
  isPending: boolean
  setPending: React.Dispatch<React.SetStateAction<boolean>>
}
const BACKGROUND_SIZE = '47rem'

export const DetachPipette = (props: DetachPipetteProps): JSX.Element => {
  const {
    isRobotMoving,
    goBack,
    proceed,
    robotName,
    attachedPipettes,
    mount,
    isPending,
    setPending,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const is96ChannelPipette = attachedPipettes[mount]?.name === 'p1000_96'

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
  } else if (!is96ChannelPipette) {
    bodyText = <StyledText as="p">{t('hold_and_loosen')}</StyledText>
  } else {
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
      header={
        isPending ? (
          <Skeleton
            width="17rem"
            height="1.75rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : (
          t(!is96ChannelPipette ? 'loose_detach' : 'unscrew_remove_96_channel')
        )
      }
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
            src={!is96ChannelPipette ? detachPipette : detach96Pipette}
            width="100%"
            alt={
              !is96ChannelPipette
                ? 'Detach pipette'
                : 'Unscrew 96 channel pipette'
            }
          />
        )
      }
      bodyText={bodyText}
      backIsDisabled={isPending}
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          isDisabled={isPending}
          robotName={robotName}
          proceedButtonText={capitalize(t('shared:continue'))}
          proceed={proceed}
          setPending={setPending}
        />
      }
    />
  )
}
