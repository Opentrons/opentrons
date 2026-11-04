import { useTranslation } from 'react-i18next'

import FillHopper from '/app/assets/videos/error-recovery/FlexStacker_FillHopper.webm'
import { TwoColumn } from '/app/molecules/InterventionModal'

import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerHopperLwInfo(props: RecoveryContentProps): ReactNode {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={t('ensure_stacker_has_labware')}
          type="location"
          layout="stacked"
          bannerText={t('make_sure_loaded_correct_number_of_labware_stacker')}
        />
        <RightColumnAnimation animationSrc={FillHopper} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
