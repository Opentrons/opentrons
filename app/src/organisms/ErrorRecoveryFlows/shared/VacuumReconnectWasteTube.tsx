import { useTranslation } from 'react-i18next'

import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoveryContentProps } from '../types'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

export function VacuumReconnectWasteTube(
  props: RecoveryContentProps
): JSX.Element {
  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const { t } = useTranslation('error_recovery')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('reconnect_waste_tube_to_carboy')}
          message={t('secure_connection_needed')}
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
