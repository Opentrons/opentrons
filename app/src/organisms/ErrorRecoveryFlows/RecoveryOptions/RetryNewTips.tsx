import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  StyledText,
  SPACING,
  DIRECTION_COLUMN,
  Box,
} from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContent, RecoveryFooterButtons } from '../shared'
import { WellSelection } from '../../WellSelection'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { Move } from '../../../molecules/InterventionModal/InterventionStep'
import { InlineNotification } from '../../../atoms/InlineNotification'

import type { WellGroup } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'
import type { UseFailedLabwareUtilsResult } from '../hooks'

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

export function ReplaceTips({
  isOnDevice,
  routeUpdateActions,
}: RecoveryContentProps): JSX.Element | null {
  const { proceedNextStep } = routeUpdateActions

  const primaryOnClick = (): void => {
    void proceedNextStep()
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        {'PLACEHOLDER'}
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

  const tertiaryBtnOnClick = (): void => {
    setShowTipSelectModal(!showTipSelectModal)
  }

  if (isOnDevice) {
    return (
      <>
        <RecoverySingleColumnContent>
          <TwoColumn>
            <SelectPickUpLocation {...props} />
            <Flex width="28.313rem">
              <TipSelection {...props} allowTipSelection={false} />
            </Flex>
          </TwoColumn>
          <RecoveryFooterButtons
            isOnDevice={isOnDevice}
            primaryBtnOnClick={primaryBtnOnClick}
            secondaryBtnOnClick={goBackPrevStep}
            primaryBtnTextOverride={t('pick_up_tips')}
            tertiaryBtnDisabled={failedPipetteInfo?.data.channels === 96}
            tertiaryBtnOnClick={tertiaryBtnOnClick}
            tertiaryBtnText={t('change_location')}
          />
        </RecoverySingleColumnContent>
      </>
    )
  } else {
    return null
  }
}

// TODO(jh, 06-12-24): EXEC-500.
function SelectPickUpLocation({
  failedLabwareUtils,
}: RecoveryContentProps): JSX.Element {
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

  return (
    <Flex gridGap={SPACING.spacing24} flexDirection={DIRECTION_COLUMN}>
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        <StyledText as="h4SemiBold">
          {t('select_tip_pickup_location')}
        </StyledText>
        <Move
          type={'refill'}
          labwareName={pickUpTipLabwareName ?? ''}
          currentLocationProps={{ slotName: buildLabwareLocationSlotName() }}
        />
      </Flex>
      <InlineNotification
        type="alert"
        heading={t('replenish_tips_and_select_location')}
      ></InlineNotification>
    </Flex>
  )
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

  const onSelectTips = (): UseFailedLabwareUtilsResult['selectTips'] => {
    if (allowTipSelection) {
      return selectTips
    } else {
      return () => null
    }
  }

  const onDeselectTips = (): UseFailedLabwareUtilsResult['deselectTips'] => {
    if (allowTipSelection) {
      return deselectTips
    } else {
      return () => null
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
