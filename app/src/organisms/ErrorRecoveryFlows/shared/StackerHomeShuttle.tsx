import { Trans, useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import ClearObstructions from '/app/assets/videos/error-recovery/FlexStacker_ClearObstructions.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerHomeShuttle(props: RecoveryContentProps): ReactNode {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions, recoveryCommands, recoveryMap } = props
  const { step } = recoveryMap
  const { proceedNextStep, goBackPrevStep, handleMotionRouting } =
    routeUpdateActions
  const { homeShuttle } = recoveryCommands

  const buildTitle = (): string => {
    switch (step) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return t('clear_track_of_obstructions')
      default:
        return t('prepare_track_for_homing')
    }
  }

  const getBodyText = (): string => {
    switch (step) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return t('clear_track_of_obstructions_and_close_door')
      default:
        return t('carefully_clear_track')
    }
  }

  const buildBodyText = (): JSX.Element => (
    <Trans
      t={t}
      i18nKey={getBodyText()}
      components={{
        block: (
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          />
        ),
      }}
    />
  )
  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true).then(() => {
      void homeShuttle().finally(() => {
        void handleMotionRouting(false).then(() => {
          proceedNextStep()
        })
      })
    })
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent headline={buildTitle()} message={buildBodyText()} />
        <RightColumnAnimation animationSrc={ClearObstructions} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryBtnOnClick}
        primaryBtnTextOverride={t('home_now')}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
