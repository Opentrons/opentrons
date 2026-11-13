import { useTranslation } from 'react-i18next'

import CheckCollar from '/app/assets/videos/error-recovery/Vacuum_CheckCollar.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function VacuumCheckCollar(props: RecoveryContentProps): ReactNode {
  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const { t } = useTranslation('error_recovery')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('check_collar')}
          message={t('proper_seal_required')}
        />
        <RightColumnAnimation animationSrc={CheckCollar} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
