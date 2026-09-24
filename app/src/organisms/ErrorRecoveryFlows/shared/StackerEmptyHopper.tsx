import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import EmptyHopper from '/app/assets/videos/error-recovery/FlexStacker_EmptyHopper.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerEmptyHopper(props: RecoveryContentProps): ReactNode {
  const { t } = useTranslation('error_recovery')
  const { routeUpdateActions, recoveryMap } = props
  const { route } = recoveryMap
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const getBodyText = (): string => {
    switch (route) {
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        return t('labware_stuck_on_latch')
      default:
        return t('close_robot_and_stacker_door_before_proceeding')
    }
  }

  const buildBodyText = (): JSX.Element => (
    <>
      <StyledText oddStyle="bodyTextRegular" desktopStyle="bodyDefaultRegular">
        {t('empty_stacker_of_all_labware')}
      </StyledText>
      <StyledText oddStyle="bodyTextRegular" desktopStyle="bodyDefaultRegular">
        {getBodyText()}
      </StyledText>
    </>
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
