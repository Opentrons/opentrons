import { useTranslation } from 'react-i18next'

import ShuttleLabware from '/app/assets/videos/error-recovery/FlexStacker_LoadLabwareOnShuttle.webm'
import { TwoColumn } from '/app/molecules/InterventionModal'

import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerShuttleLwInfo(props: RecoveryContentProps): ReactNode {
  const { t } = useTranslation('error_recovery')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={t('load_labware_into_labware_shuttle')}
          type="location"
          layout="default"
          showQuantity={false}
        />
        <RightColumnAnimation animationSrc={ShuttleLabware} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={props.routeUpdateActions.proceedNextStep}
        secondaryBtnOnClick={props.routeUpdateActions.goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
