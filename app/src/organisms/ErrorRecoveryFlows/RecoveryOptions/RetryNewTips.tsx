import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
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

  return (
    <RecoverySingleColumnContent>
      {'PLACEHOLDER'}
      <RecoveryFooterButtons
        isOnDevice={isOnDevice}
        primaryBtnOnClick={primaryOnClick}
      />
    </RecoverySingleColumnContent>
  )
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

  const { goBackPrevStep, setRobotInMotion } = routeUpdateActions

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_PICKING_UP_TIPS.ROUTE)
  }

  return (
    <RecoverySingleColumnContent>
      <TwoColumn>
        <SelectPickUpLocation {...props} />
        <TipSelection {...props} allowTipSelection={false} />
      </TwoColumn>
      <RecoveryFooterButtons
        isOnDevice={isOnDevice}
        primaryBtnOnClick={() => null}
        secondaryBtnOnClick={goBackPrevStep}
        primaryBtnTextOverride={t('pick_up_tips')}
        tertiaryBtnDisabled={failedPipetteInfo?.data.channels === 96}
        tertiaryBtnOnClick={() => null}
        tertiaryBtnText={t('change_location')}
      />
    </RecoverySingleColumnContent>
  )
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
