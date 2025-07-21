import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { JUSTIFY_CENTER, RESPONSIVENESS } from '@opentrons/components'

import stackerImage from '/app/assets/images/stacker_shuttle_empty.png'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'

export function StackerEnsureShuttleEmpty(
  props: RecoveryContentProps
): JSX.Element | null {
  const { routeUpdateActions } = props
  const {
    proceedNextStep,
    goBackPrevStep,
  } = routeUpdateActions
  const { t } = useTranslation('error_recovery')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('ensure_stacker_shuttle_empty')}
          message={t('empty_shuttle_to_retry_retrieve')}
        />
        <img src={stackerImage} alt="Stacker shuttle empty" css={IMAGE_STYLE} />
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
