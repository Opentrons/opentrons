import * as React from 'react'
import { useTranslation } from 'react-i18next'

import detach96Pipette from '../../assets/images/change-pip/detach-96-pipette.png'
import { Skeleton } from '../../atoms/Skeleton'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { CheckPipetteButton } from './CheckPipetteButton'
import { BODY_STYLE, SECTIONS } from './constants'
import type { PipetteWizardStepProps } from './types'
import { getPipetteAnimations } from './utils'

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
    flowType,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const pipetteWizardStep = {
    mount,
    flowType,
    section: SECTIONS.DETACH_PIPETTE,
  }
  const is96ChannelPipette =
    attachedPipettes[mount]?.instrumentName === 'p1000_96'
  const channel = attachedPipettes[mount]?.data.channels
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
          `${i18n.format(t('loose_detach'))}${
            attachedPipettes[mount]?.displayName
          }`
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
        ) : is96ChannelPipette ? (
          <img
            src={detach96Pipette}
            width="100%"
            alt={'Unscrew 96 channel pipette'}
          />
        ) : (
          getPipetteAnimations({ pipetteWizardStep, channel })
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
