import { Trans, useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import EmptyHopper from '/app/assets/videos/error-recovery/FlexStacker_EmptyHopper.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { RecoveryContentProps } from '../types'

export function StackerEmptyHopper(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const buildBodyText = (): JSX.Element => (
    <Trans
      t={t}
      i18nKey="empty_stacker_of_labware_above_latch_labware_stuck"
      components={{
        block: (
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          />
        ),
      }}
    />
  )

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('empty_stacker_of_labware_above_latch')}
          message={buildBodyText()}
        />
        <RightColumnAnimation animationSrc={EmptyHopper} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
