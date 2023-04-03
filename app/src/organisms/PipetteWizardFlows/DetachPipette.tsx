import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { Skeleton } from '../../atoms/Skeleton'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import detachPipette from '../../assets/images/change-pip/single-channel-detach-pipette.png'
import detach96Pipette from '../../assets/images/change-pip/detach-96-pipette.png'
import { CheckPipetteButton } from './CheckPipetteButton'
import { BODY_STYLE } from './constants'
import type { PipetteWizardStepProps } from './types'

interface DetachPipetteProps extends PipetteWizardStepProps {
  isFetching: boolean
  setFetching: React.Dispatch<React.SetStateAction<boolean>>
}
const BACKGROUND_SIZE = '47rem'

export const DetachPipette = (props: DetachPipetteProps): JSX.Element => {
  const {
    isRobotMoving,
    goBack,
    proceed,
    attachedPipettes,
    mount,
    isFetching,
    setFetching,
    isOnDevice,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const is96ChannelPipette = attachedPipettes[mount]?.name === 'p1000_96'

  let bodyText: React.ReactNode = <div></div>
  if (isFetching) {
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
  } else {
    bodyText = <StyledText css={BODY_STYLE}>{t('hold_and_loosen')}</StyledText>
  }

  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
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
            t('loose_detach', {
              pipetteName: attachedPipettes[mount]?.modelSpecs.displayName,
            }),
            'capitalize'
          )
        )
      }
      //  TODO(Jr, 11/8/22): replace image with correct one!
      rightHandBody={
        isFetching ? (
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
      backIsDisabled={isFetching}
      back={goBack}
      proceedButton={
        <CheckPipetteButton
          isOnDevice={isOnDevice}
          proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
          proceed={proceed}
          setFetching={setFetching}
          isFetching={isFetching}
        />
      }
    />
  )
}
