import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { TwoColumn } from '/app/molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { TipSelectionModal } from './TipSelectionModal'
import { TipSelection } from './TipSelection'

import type { RecoveryContentProps } from '../types'

export function SelectTips(props: RecoveryContentProps): JSX.Element | null {
  const {
    failedPipetteInfo,
    routeUpdateActions,
    recoveryCommands,
    isOnDevice,
    failedLabwareUtils,
  } = props
  const { ROBOT_PICKING_UP_TIPS } = RECOVERY_MAP
  const { pickUpTips } = recoveryCommands
  const {
    goBackPrevStep,
    handleMotionRouting,
    proceedNextStep,
  } = routeUpdateActions
  const { t } = useTranslation('error_recovery')
  const [showTipSelectModal, setShowTipSelectModal] = React.useState(false)

  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_PICKING_UP_TIPS.ROUTE)
      .then(() => pickUpTips())
      .then(() => proceedNextStep())
  }

  const toggleModal = (): void => {
    setShowTipSelectModal(!showTipSelectModal)
  }

  const buildTertiaryBtnProps = (): {
    tertiaryBtnDisabled?: boolean
    tertiaryBtnOnClick?: () => void
    tertiaryBtnText?: string
  } => {
    if (isOnDevice) {
      return {
        tertiaryBtnDisabled: failedPipetteInfo?.data.channels === 96,
        tertiaryBtnOnClick: toggleModal,
        tertiaryBtnText: t('change_location'),
      }
    } else {
      return {}
    }
  }

  return (
    <>
      {showTipSelectModal && (
        <TipSelectionModal
          {...props}
          allowTipSelection={true}
          toggleModal={toggleModal}
        />
      )}
      <RecoverySingleColumnContentWrapper>
        <TwoColumn>
          <LeftColumnLabwareInfo
            {...props}
            title={t('select_tip_pickup_location')}
            type="location"
            bannerText={t('replace_tips_and_select_location')}
          />
          <TipSelection {...props} allowTipSelection={!isOnDevice} />
        </TwoColumn>
        <RecoveryFooterButtons
          primaryBtnOnClick={primaryBtnOnClick}
          primaryBtnDisabled={!failedLabwareUtils.areTipsSelected}
          secondaryBtnOnClick={goBackPrevStep}
          primaryBtnTextOverride={t('pick_up_tips')}
          {...buildTertiaryBtnProps()}
        />
      </RecoverySingleColumnContentWrapper>
    </>
  )
}
