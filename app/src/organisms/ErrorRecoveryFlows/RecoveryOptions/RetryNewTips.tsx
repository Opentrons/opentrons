import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Box,
  StyledText,
  SPACING,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContent, RecoveryFooterButtons } from '../shared'
import { WellSelection } from '../../WellSelection'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { Move } from '../../../molecules/InterventionModal/InterventionStep'
import { InlineNotification } from '../../../atoms/InlineNotification'
import { Modal } from '../../../molecules/Modal'

import type { WellGroup } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'
import type { ModalHeaderBaseProps } from '../../../molecules/Modal/types'
import { createPortal } from 'react-dom'
import { getTopPortalEl } from '../../../App/portal'

export function RetryNewTips(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap } = props

  const buildContent = (): JSX.Element | null => {
    const { RETRY_NEW_TIPS } = RECOVERY_MAP
    const { step } = recoveryMap

    switch (step) {
      case RETRY_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <ReplaceTips {...props} />
      case RETRY_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case RETRY_NEW_TIPS.STEPS.RETRY:
        return <RetryWithNewTips {...props} />
      default:
        return <ReplaceTips {...props} />
    }
  }

  return buildContent()
}

//TOME: Ticket or solve not using the full row for multichannel.
export function ReplaceTips(props: RecoveryContentProps): JSX.Element | null {
  const {
    isOnDevice,
    routeUpdateActions,
    failedPipetteInfo,
    failedLabwareUtils,
  } = props
  const { t } = useTranslation('error_recovery')
  const { proceedNextStep } = routeUpdateActions
  const { pickUpTipLabware } = failedLabwareUtils

  const primaryOnClick = (): void => {
    void proceedNextStep()
  }

  const buildTitle = (): string => {
    if (failedPipetteInfo?.data.channels === 96) {
      return t('replace_with_new_tip_rack')
    } else {
      return t('replace_used_tips_in_rack_location', {
        location: pickUpTipLabware?.location,
      })
    }
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <LeftColumnTipInfo {...props} title={buildTitle()} />
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            PLACEHOLDER
          </Flex>
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryOnClick}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

export function SelectTips(props: RecoveryContentProps): JSX.Element | null {
  const {
    failedPipetteInfo,
    isOnDevice,
    routeUpdateActions,
    recoveryCommands,
  } = props
  const { ROBOT_PICKING_UP_TIPS } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')
  const [showTipSelectModal, setShowTipSelectModal] = React.useState(false)

  const { pickUpTips } = recoveryCommands
  const {
    goBackPrevStep,
    setRobotInMotion,
    proceedNextStep,
  } = routeUpdateActions

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
            <LeftColumnTipInfo
              {...props}
              title={t('select_tip_pickup_location')}
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

type LeftColumnTipInfoProps = RecoveryContentProps & {
  title: string
}

// TODO(jh, 06-12-24): EXEC-500 & EXEC-501.
// The left column component adjacent to RecoveryDeckMap/TipSelection.
function LeftColumnTipInfo({
  title,
  failedLabwareUtils,
  isOnDevice,
}: LeftColumnTipInfoProps): JSX.Element | null {
  const { pickUpTipLabwareName, pickUpTipLabware } = failedLabwareUtils
  const { t } = useTranslation('error_recovery')

  const buildLabwareLocationSlotName = (): string => {
    const location = pickUpTipLabware?.location
    if (
      location != null &&
      typeof location === 'object' &&
      'slotName' in location
    ) {
      return location.slotName
    } else {
      return ''
    }
  }

  if (isOnDevice) {
    return (
      <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          <StyledText as="h4SemiBold">{title}</StyledText>
          <Move
            type={'refill'}
            labwareName={pickUpTipLabwareName ?? ''}
            currentLocationProps={{ slotName: buildLabwareLocationSlotName() }}
          />
        </Flex>
        <InlineNotification
          type="alert"
          heading={t('replace_tips_and_select_location')}
        ></InlineNotification>
      </Flex>
    )
  } else {
    return null
  }
}

function RetryWithNewTips({
  isOnDevice,
  routeUpdateActions,
  recoveryCommands,
}: RecoveryContentProps): JSX.Element | null {
  const { ROBOT_RETRYING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')
  const { goBackPrevStep, setRobotInMotion } = routeUpdateActions
  const { retryFailedCommand, resumeRun } = recoveryCommands

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_RETRYING_STEP.ROUTE)
      .then(() => retryFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <StyledText as="h4SemiBold">{t('retry_with_new_tips')}</StyledText>
            <StyledText as="p">{t('robot_will_retry_with_tips')}</StyledText>
          </Flex>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            PLACEHOLDER
          </Flex>
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryBtnOnClick}
          primaryBtnTextOverride={t('retry_now')}
          secondaryBtnOnClick={goBackPrevStep}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

type TipSelectionProps = RecoveryContentProps & {
  allowTipSelection: boolean
}

function TipSelection(props: TipSelectionProps): JSX.Element {
  const { failedLabwareUtils, failedPipetteInfo, allowTipSelection } = props

  const {
    tipSelectorDef,
    selectedTipLocations,
    selectTips,
    deselectTips,
  } = failedLabwareUtils

  const onSelectTips = (tipGroup: WellGroup): void => {
    if (allowTipSelection) {
      selectTips(tipGroup)
    }
  }

  const onDeselectTips = (locations: string[]): void => {
    if (allowTipSelection) {
      deselectTips(locations)
    }
  }

  return (
    <WellSelection
      definition={tipSelectorDef}
      deselectWells={onDeselectTips}
      selectedPrimaryWells={selectedTipLocations as WellGroup}
      selectWells={onSelectTips}
      channels={failedPipetteInfo?.data.channels ?? 1}
    />
  )
}

type TipSelectionModalProps = TipSelectionProps & {
  toggleModal: () => void
}

function TipSelectionModal(props: TipSelectionModalProps): JSX.Element | null {
  const { toggleModal } = props
  const { t } = useTranslation('error_recovery')

  const modalHeader: ModalHeaderBaseProps = {
    title: t('change_tip_pickup_location'),
    hasExitIcon: true,
  }

  if (props.isOnDevice) {
    return createPortal(
      <Modal header={modalHeader} onOutsideClick={toggleModal} zIndex={15}>
        <TipSelection {...props} />
      </Modal>,
      getTopPortalEl()
    )
  } else {
    return null
  }
}
