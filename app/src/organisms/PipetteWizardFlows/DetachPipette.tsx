import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { RIGHT } from '@opentrons/shared-data'
import { TYPOGRAPHY, COLORS } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
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
    errorMessage,
    setShowErrorMessage,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const pipetteWizardStep = {
    mount,
    flowType,
    section: SECTIONS.DETACH_PIPETTE,
  }
  const memoizedAttachedPipettes = React.useMemo(() => attachedPipettes, [])
  const is96ChannelPipette =
    memoizedAttachedPipettes[mount]?.instrumentName === 'p1000_96'
  const handle96ChannelProceed = (): void => {
    chainRunCommands?.(
      [
        {
          commandType: 'home' as const,
          params: {
            axes: ['leftZ'],
          },
        },
        {
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
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }
  const channel = memoizedAttachedPipettes[mount]?.data.channels
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
  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.errorEnabled}
      header={t('shared:error_encountered')}
      subHeader={
        <Trans
          t={t}
          i18nKey={'detach_pipette_error'}
          values={{ error: errorMessage }}
          components={{
            block: <StyledText as="p" />,
            bold: (
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
            ),
          }}
        />
      }
    />
  ) : (
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
            memoizedAttachedPipettes[mount]?.displayName
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
