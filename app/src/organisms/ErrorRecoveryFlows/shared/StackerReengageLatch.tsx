import { useTranslation } from 'react-i18next'

import ReengageLatch from '/app/assets/images/flex_stacker_reengage_latch.png'
import { RECOVERY_MAP } from '../constants'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'

export function StackerReengageLatch(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions, recoveryCommands } = props
  const { proceedNextStep, goBackPrevStep, handleMotionRouting } = routeUpdateActions
  const { closeLabwareLatch } = recoveryCommands
  const { ROBOT_IN_MOTION } = RECOVERY_MAP

  const primaryOnClick = (): void => {
    void handleMotionRouting(true, ROBOT_IN_MOTION.ROUTE).then(() => {
      void closeLabwareLatch().then(() => {
        void proceedNextStep()
      })
    })
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('prepare_for_stacker_latch_reengage')}
          message={t('stacker_latch_will_reengage')}
        />
        <img src={ReengageLatch} width="100%" />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        primaryBtnTextOverride={t('re_engage_latch')}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
