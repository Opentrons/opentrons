import { Trans, useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

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

  const messageElement = (
    <Trans
      t={t}
      i18nKey="carefully_unscrew_and_empty_carboy"
      components={{ block: <StyledText desktopStyle="bodyDefaultRegular" /> }}
    />
  )

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('disconnect_and_empty_carboy')}
          message={messageElement}
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
