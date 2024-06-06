import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  SPACING,
  Flex,
  StyledText,
} from '@opentrons/components'

import { RadioButton } from '../../../atoms/buttons'
import { ODD_SECTION_TITLE_STYLE, RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'

import type { RecoveryContentProps, RecoveryRoute } from '../types'

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

function BeginRemoval({
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
  const mount = pipettesWithTip[0].mount // This is safe and will always be truthy.

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
            buttonLabel="begin-removal"
            buttonValue={t('begin_removal')}
            onChange={() => {
              setSelected('begin-removal')
            }}
            isSelected={selected === 'begin-removal'}
          />
          <RadioButton
            buttonLabel="skip"
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

function DropTipFlowsContainer(props: RecoveryContentProps): JSX.Element {}
