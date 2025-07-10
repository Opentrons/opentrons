import { useTranslation } from 'react-i18next'

import FillHopper from '/app/assets/videos/error-recovery/FlexStacker_FillHopper.webm'
import { TwoColumn } from '/app/molecules/InterventionModal'

import { ERROR_KINDS } from '../constants'
import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { RecoveryContentProps } from '../types'

export function StackerHopperLwInfo(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions, failedLabwareUtils, errorKind } = props
  const { labwareQuantity } = failedLabwareUtils
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const title =
    errorKind === ERROR_KINDS.STACKER_HOPPER_EMPTY
      ? t('load_labware_into_stacker', { quantity: labwareQuantity })
      : t('ensure_stacker_has_labware')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={title}
          type={'location'}
          layout={'stacked'}
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
