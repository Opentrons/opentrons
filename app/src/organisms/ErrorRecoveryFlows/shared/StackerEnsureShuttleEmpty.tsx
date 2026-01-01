import { useTranslation } from 'react-i18next'

import stackerImage from '/app/assets/images/stacker_shuttle_empty.png'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'

export function StackerEnsureShuttleEmpty(
  props: RecoveryContentProps
): JSX.Element | null {
  const { routeUpdateActions, recoveryMap } = props
  const { route } = recoveryMap
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions
  const { t } = useTranslation('error_recovery')

  const storeSkip =
    route === RECOVERY_MAP.STACKER_STALLED_STORE_SKIP.ROUTE ||
    route === RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.ROUTE
  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('ensure_stacker_shuttle_empty')}
          message={
            storeSkip
              ? t('empty_shuttle_to_retry_store')
              : t('empty_shuttle_to_retry_retrieve')
          }
        />
        <img src={stackerImage} alt="Stacker shuttle empty" width="100%" />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
