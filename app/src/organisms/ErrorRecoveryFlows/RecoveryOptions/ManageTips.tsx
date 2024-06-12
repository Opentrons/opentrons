import * as React from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'

import {
  DIRECTION_COLUMN,
  SPACING,
  Flex,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { RadioButton } from '../../../atoms/buttons'
import { ODD_SECTION_TITLE_STYLE, RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'
import { DropTipWizardFlows } from '../../DropTipWizardFlows'

import type { PipetteWithTip } from '../../DropTipWizardFlows'
import type { RecoveryContentProps } from '../types'
import type { FixitCommandTypeUtils } from '../../DropTipWizardFlows/types'

// The Drop Tip flow entry point. Includes entry from SelectRecoveryOption and CancelRun.
export function ManageTips(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap } = props

  const buildContent = (): JSX.Element => {
    const { DROP_TIP_FLOWS } = RECOVERY_MAP
    const { step } = recoveryMap

    switch (step) {
      case DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL:
        return <BeginRemoval {...props} />
      case DROP_TIP_FLOWS.STEPS.WIZARD:
        return <DropTipFlowsContainer {...props} />
      default:
        return <BeginRemoval {...props} />
    }
  }

  return buildContent()
}

type RemovalOptions = 'begin-removal' | 'skip'

export function BeginRemoval({
  isOnDevice,
  tipStatusUtils,
  routeUpdateActions,
  recoveryCommands,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { pipettesWithTip } = tipStatusUtils
  const { proceedNextStep, setRobotInMotion } = routeUpdateActions
  const { cancelRun } = recoveryCommands
  const { ROBOT_CANCELING } = RECOVERY_MAP
  const mount = head(pipettesWithTip)?.mount

  const [selected, setSelected] = React.useState<RemovalOptions>(
    'begin-removal'
  )

  const primaryOnClick = (): void => {
    if (selected === 'begin-removal') {
      void proceedNextStep()
    } else {
      void setRobotInMotion(true, ROBOT_CANCELING.ROUTE).then(() => {
        cancelRun()
      })
    }
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <StyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
          {t('you_may_want_to_remove', { mount })}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RadioButton
            buttonLabel={t('begin_removal')}
            buttonValue={t('begin_removal')}
            onChange={() => {
              setSelected('begin-removal')
            }}
            isSelected={selected === 'begin-removal'}
          />
          <RadioButton
            buttonLabel={t('skip')}
            buttonValue={t('skip')}
            onChange={() => {
              setSelected('skip')
            }}
            isSelected={selected === 'skip'}
          />
        </Flex>
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

// TODO(jh, 06-07-24): Ensure that ALL errors within DT Flows provide routing back to ER for proper error handling, EXEC-512.
function DropTipFlowsContainer(props: RecoveryContentProps): JSX.Element {
  const { tipStatusUtils, routeUpdateActions, recoveryCommands, isFlex } = props
  const { DROP_TIP_FLOWS, ROBOT_CANCELING } = RECOVERY_MAP
  const { proceedToRouteAndStep, setRobotInMotion } = routeUpdateActions
  const { setTipStatusResolved } = tipStatusUtils
  const { cancelRun } = recoveryCommands

  const { mount, specs } = head(
    tipStatusUtils.pipettesWithTip
  ) as PipetteWithTip // Safe as we have to have tips to get to this point in the flow.

  const onCloseFlow = (): void => {
    void setTipStatusResolved(onEmptyCache, onTipsDetected)
  }

  const onEmptyCache = (): void => {
    void setRobotInMotion(true, ROBOT_CANCELING.ROUTE).then(() => {
      cancelRun()
    })
  }

  const onTipsDetected = (): void => {
    void proceedToRouteAndStep(DROP_TIP_FLOWS.ROUTE)
  }

  return (
    <RecoverySingleColumnContent>
      <DropTipWizardFlows
        robotType={isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE}
        closeFlow={onCloseFlow}
        mount={mount}
        instrumentModelSpecs={specs}
        fixitCommandTypeUtils={useDropTipFlowUtils(props)}
      />
    </RecoverySingleColumnContent>
  )
}

// Builds the overrides injected into DT Wiz.
export function useDropTipFlowUtils({
  tipStatusUtils,
  failedCommand,
  previousRoute,
  trackExternalMap,
}: RecoveryContentProps): FixitCommandTypeUtils {
  const { t } = useTranslation('error_recovery')
  const { runId } = tipStatusUtils
  const failedCommandId = failedCommand?.id ?? '' // We should have a failed command here unless the run is not in AWAITING_RECOVERY.

  const buildTipDropCompleteBtn = (): string => {
    switch (previousRoute) {
      default:
        return t('proceed_to_cancel')
    }
  }

  const buildCopyOverrides = (): FixitCommandTypeUtils['copyOverrides'] => {
    return {
      tipDropCompleteBtnCopy: buildTipDropCompleteBtn(),
      beforeBeginningTopText: t('preserve_aspirated_liquid'),
    }
  }

  return {
    runId,
    failedCommandId,
    copyOverrides: buildCopyOverrides(),
    trackCurrentMap: trackExternalMap,
  }
}
