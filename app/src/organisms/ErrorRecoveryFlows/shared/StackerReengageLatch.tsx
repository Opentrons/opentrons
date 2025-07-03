import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  JUSTIFY_CENTER,
  RESPONSIVENESS,
} from '@opentrons/components'

import ReengageLatch from '/app/assets/images/flex_stacker_reengage_latch.png'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'

export function StackerReengageLatch(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('prepare_for_stacker_latch_reengage')}
          message={t('stacker_latch_will_reengage')}
        />
        <img src={ReengageLatch} css={IMAGE_STYLE} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

const IMAGE_STYLE = css`
  justify-content: ${JUSTIFY_CENTER};
  overflow: hidden;
  max-height: 13.25rem;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 27rem;
    height: 20.25rem;
  }
`