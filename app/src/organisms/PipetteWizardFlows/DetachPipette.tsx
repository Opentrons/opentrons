import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { RIGHT } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { Skeleton } from '../../atoms/Skeleton'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { CheckPipetteButton } from './CheckPipetteButton'
import { BODY_STYLE, SECTIONS } from './constants'
import { getPipetteAnimations, getPipetteAnimations96 } from './utils'
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
    chainRunCommands,
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
  const handle96ChannelProceed = (): void => {
    chainRunCommands(
      [
        {
          // @ts-expect-error calibration type not yet supported
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: RIGHT,
            maintenancePosition: 'attachPlate',
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(() => {
        proceed()
      })
  }
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
      rightHandBody={
        isFetching ? (
          <Skeleton
            width="100%"
            height="14.375rem"
            backgroundSize={BACKGROUND_SIZE}
          />
        ) : is96ChannelPipette ? (
          getPipetteAnimations96({
            section: pipetteWizardStep.section,
            flowType: flowType,
          })
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
          proceed={is96ChannelPipette ? handle96ChannelProceed : proceed}
          setFetching={setFetching}
          isFetching={isFetching}
        />
      }
    />
  )
}
