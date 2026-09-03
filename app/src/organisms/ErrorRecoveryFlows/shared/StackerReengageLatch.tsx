import { useTranslation } from 'react-i18next'

import ReengageLatch from '/app/assets/images/flex_stacker_reengage_latch.png'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerReengageLatch(props: RecoveryContentProps): ReactNode {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions, recoveryCommands } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions
  const { closeLabwareLatch } = recoveryCommands

  const primaryOnClick = (): void => {
    void closeLabwareLatch().then(() => {
      void proceedNextStep()
    })
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('prepare_for_stacker_latch_reengage')}
          message={t('stacker_latch_will_reengage')}
        />
        <img
          src={ReengageLatch}
          width="100%"
          alt="Visual preview of re-engaging the Flex Stacker latch"
        />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        primaryBtnTextOverride={t('re_engage_latch')}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
