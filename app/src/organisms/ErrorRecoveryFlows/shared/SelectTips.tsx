import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContent } from './RecoverySingleColumnContent'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { TipSelectionModal } from './TipSelectionModal'
import { TipSelection } from './TipSelection'

import type { RecoveryContentProps } from '../types'

export function SelectTips(props: RecoveryContentProps): JSX.Element | null {
  const {
    failedPipetteInfo,
    isOnDevice,
    routeUpdateActions,
    recoveryCommands,
  } = props
  const { ROBOT_PICKING_UP_TIPS } = RECOVERY_MAP
  const { pickUpTips } = recoveryCommands
  const {
    goBackPrevStep,
    setRobotInMotion,
    proceedNextStep,
  } = routeUpdateActions
  const { t } = useTranslation('error_recovery')
  const [showTipSelectModal, setShowTipSelectModal] = React.useState(false)

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_PICKING_UP_TIPS.ROUTE)
      .then(() => pickUpTips())
      .then(() => proceedNextStep())
  }

  const toggleModal = (): void => {
    setShowTipSelectModal(!showTipSelectModal)
  }

  if (isOnDevice) {
    return (
      <>
        {showTipSelectModal && (
          <TipSelectionModal
            {...props}
            allowTipSelection={true}
            toggleModal={toggleModal}
          />
        )}
        <RecoverySingleColumnContent>
          <TwoColumn>
            <LeftColumnLabwareInfo
              {...props}
              title={t('select_tip_pickup_location')}
              moveType="refill"
              bannerText={t('replace_tips_and_select_location')}
            />
            <TipSelection {...props} allowTipSelection={false} />
          </TwoColumn>
          <RecoveryFooterButtons
            isOnDevice={isOnDevice}
            primaryBtnOnClick={primaryBtnOnClick}
            secondaryBtnOnClick={goBackPrevStep}
            primaryBtnTextOverride={t('pick_up_tips')}
            tertiaryBtnDisabled={failedPipetteInfo?.data.channels === 96}
            tertiaryBtnOnClick={toggleModal}
            tertiaryBtnText={t('change_location')}
          />
        </RecoverySingleColumnContent>
      </>
    )
  } else {
    return null
  }
}
