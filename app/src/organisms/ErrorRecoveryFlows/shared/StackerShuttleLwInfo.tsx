import { useTranslation } from 'react-i18next'

import ShuttleLabware from '/app/assets/videos/error-recovery/FlexStacker_LoadLabwareOnShuttle.webm'
import { TwoColumn } from '/app/molecules/InterventionModal'

import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RightColumnAnimation } from './RightColumnAnimation'

import type { RecoveryContentProps } from '../types'

export function StackerShuttleLwInfo(props: RecoveryContentProps): JSX.Element {
  const { recoveryCommands, routeUpdateActions } = props
  const { manualRetrieve } = recoveryCommands
  const { proceedNextStep } = routeUpdateActions

  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    void manualRetrieve().then(() => proceedNextStep())
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={t('load_labware_into_labware_shuttle')}
          type={'location'}
          layout={'stacked'}
        />
        <RightColumnAnimation animationSrc={ShuttleLabware} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={props.routeUpdateActions.goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
