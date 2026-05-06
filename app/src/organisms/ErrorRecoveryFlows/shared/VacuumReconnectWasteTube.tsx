import { useTranslation } from 'react-i18next'

import AttachCarboyCap from '/app/assets/videos/error-recovery/Vacuum_AttachCarboyCap.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { RecoveryContentProps } from '../types'

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
        <RightColumnAnimation animationSrc={AttachCarboyCap} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
