import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  POSITION_FIXED,
  COLORS,
} from '@opentrons/components'
import { getTopPortalEl } from '../../../App/portal'
import { ChildNavigation } from '../../ChildNavigation'
import { InputField } from '../../../atoms/InputField'
import { NumericalKeyboard } from '../../../atoms/SoftwareKeyboard'
import { getFlowRateRange } from '../utils'

import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  FlowRateKind,
} from '../types'

import { ACTIONS } from '../constants'
import { createPortal } from 'react-dom'

interface FlowRateEntryProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function FlowRateEntry(props: FlowRateEntryProps): JSX.Element {
  const { onBack, state, dispatch, kind } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const keyboardRef = React.useRef(null)

  const [flowRate, setFlowRate] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.aspirateFlowRate
      : kind === 'dispense'
      ? state.dispenseFlowRate
      : null
  )
  const flowRateRange = getFlowRateRange(state, kind)
  let headerCopy: string = ''
  let textEntryCopy: string = ''
  let flowRateAction:
    | typeof ACTIONS.SET_ASPIRATE_FLOW_RATE
    | typeof ACTIONS.SET_DISPENSE_FLOW_RATE
    | null = null
  if (kind === 'aspirate') {
    headerCopy = t('aspirate_flow_rate')
    textEntryCopy = t('aspirate_flow_rate_µL')
    flowRateAction = ACTIONS.SET_ASPIRATE_FLOW_RATE
  } else if (kind === 'dispense') {
    headerCopy = t('dispense_flow_rate')
    textEntryCopy = t('dispense_flow_rate_µL')
    flowRateAction = ACTIONS.SET_DISPENSE_FLOW_RATE
  }

  const handleClickSave = (): void => {
    // the button will be disabled if this values is null
    if (flowRate != null && flowRateAction != null) {
      dispatch({
        type: flowRateAction,
        rate: flowRate,
      })
    }
    onBack()
  }

  const error =
    flowRate !== null &&
    (flowRate < flowRateRange.min || flowRate > flowRateRange.max)
      ? t(`value_out_of_range`, {
          min: flowRateRange.min,
          max: flowRateRange.max,
        })
      : null

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={headerCopy}
        buttonText={i18n.format(t('shared:save'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickSave}
        top={SPACING.spacing8}
        buttonIsDisabled={error != null || flowRate === null}
      />
      test
      <Flex
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing48}
        paddingX={SPACING.spacing40}
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
        marginTop="7.75rem" // using margin rather than justify due to content moving with error message
        alignItems={ALIGN_CENTER}
        height="22rem"
      >
        <Flex
          width="30.5rem"
          height="100%"
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing68}
        >
          <InputField
            type="number"
            value={flowRate}
            title={textEntryCopy}
            error={error}
            readOnly
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
          borderRadius="0"
        >
          <NumericalKeyboard
            keyboardRef={keyboardRef}
            onChange={e => {
              setFlowRate(Number(e))
            }}
          />
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
