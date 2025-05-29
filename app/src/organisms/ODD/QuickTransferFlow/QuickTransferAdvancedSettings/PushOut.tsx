import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch } from 'react'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface PushOutProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function PushOut(props: PushOutProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const [pushOutIsEnabled, setPushOutIsEnabled] = useState<boolean | null>(
    state.pushOut ?? null
  )
  const enablePreWetTipDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setPushOutIsEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setPushOutIsEnabled(false)
      },
    },
  ]

  const handleClickBackOrExit = (): void => {
    onBack()
  }

  const handleClickSave = (): void => {
    dispatch({
      type: ACTIONS.SET_PUSH_OUT,
      pushOut: !state.pushOut,
    })
    trackEventWithRobotSerial({
      name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
      properties: {
        setting: `Push-out_${kind}`,
      },
    })
    onBack()
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('push_out_after_dispensing')}
        buttonText={i18n.format(t('shared:save'), 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSave}
        top={SPACING.spacing8}
        buttonIsDisabled={pushOutIsEnabled === null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing24}
        width="100%"
      >
        <StyledText oddStyle="level4HeaderRegular">
          {t('push_out_description')}
        </StyledText>

        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {enablePreWetTipDisplayItems.map(displayItem => (
            <RadioButton
              key={displayItem.description}
              isSelected={pushOutIsEnabled === displayItem.option}
              onChange={displayItem.onClick}
              buttonValue={displayItem.description}
              buttonLabel={displayItem.description}
              radioButtonType="large"
            />
          ))}
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
