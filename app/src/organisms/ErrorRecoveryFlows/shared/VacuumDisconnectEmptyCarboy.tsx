import { useTranslation } from 'react-i18next'

import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { RecoveryContentProps } from '../types'

export function VacuumDisconnectEmptyCarboy(
  props: RecoveryContentProps
): JSX.Element {
  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const { t } = useTranslation('error_recovery')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('disconnect_and_empty_carboy')}
          message={t('carefully_unscrew_and_empty_carboy')}
        />
        {/* TODO(nd, 02-24-26): Add animation */}
        <RightColumnAnimation animationSrc={''} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
