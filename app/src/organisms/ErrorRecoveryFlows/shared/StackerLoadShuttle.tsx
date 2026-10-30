import { useTranslation } from 'react-i18next'

import InstallShuttle from '/app/assets/videos/error-recovery/FlexStacker_InstallShuttle.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerLoadShuttle(props: RecoveryContentProps): ReactNode {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('load_labware_shuttle_onto_track')}
          message={t('take_any_necessary_precautions_before_loading_shuttle')}
        />
        <RightColumnAnimation animationSrc={InstallShuttle} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
