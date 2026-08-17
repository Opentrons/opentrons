import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  SPACING,
  TouchInputField,
} from '@opentrons/components'
import {
  getTipTypeFromTipRackDefinition,
  LOW_VOLUME_PIPETTES,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import {
  isValidNumericalInput,
  StatelessNumericalKeyboard,
} from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch } from 'react'
import type { SupportedTip } from '@opentrons/shared-data'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface FlowRateEntryProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function FlowRateEntry(props: FlowRateEntryProps): JSX.Element {
  const { onBack, state, dispatch, kind } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()

  const initialFlowRate =
    kind === 'aspirate' ? state.aspirateFlowRate : state.dispenseFlowRate
  const [flowRate, setFlowRate] = useState<string>(
    String(initialFlowRate ?? '')
  )
  const flowRateAsNumber = flowRate !== '' ? Number(flowRate) : null

  // TODO (ba, 2024-07-02): use the pipette name once we add it to the v2 spec
  let pipetteName = state.pipette.model
  if (state.pipette.channels === 1) {
    pipetteName = pipetteName + `_single_flex`
  } else if (state.pipette.channels === 8) {
    pipetteName = pipetteName + `_multi_flex`
  } else {
    pipetteName = pipetteName + `_96`
  }

  // use lowVolume for volumes lower than 5ml
  const liquidSpecs = state.pipette.liquids
  const tipType = getTipTypeFromTipRackDefinition(state.tipRack)
  const flowRatesForSupportedTip: SupportedTip | undefined =
    state.volume < 5 &&
    `lowVolumeDefault` in liquidSpecs &&
    LOW_VOLUME_PIPETTES.includes(pipetteName)
      ? liquidSpecs.lowVolumeDefault.supportedTips[tipType]
      : liquidSpecs.default.supportedTips[tipType]
  const minFlowRate = 1
  const maxFlowRate = Math.floor(flowRatesForSupportedTip?.uiMaxFlowRate ?? 0)

  const flowRateAction =
    kind === 'aspirate'
      ? ACTIONS.SET_ASPIRATE_FLOW_RATE
      : ACTIONS.SET_DISPENSE_FLOW_RATE

  let headerCopy: string = ''
  let textEntryCopy: string = ''
  if (kind === 'aspirate') {
    headerCopy = t('aspirate_flow_rate')
    textEntryCopy = t('aspirate_flow_rate_µL')
  } else if (kind === 'dispense') {
    headerCopy = t('dispense_flow_rate')
    textEntryCopy = t('dispense_flow_rate_µL')
  }

  const handleClickSave = (): void => {
    // the button will be disabled if this values is null
    if (flowRateAsNumber != null && !Number.isNaN(flowRateAsNumber)) {
      dispatch({
        type: flowRateAction,
        rate: flowRateAsNumber,
      })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `FlowRate_${kind}`,
        },
      })
    }
    onBack()
  }

  const error =
    flowRateAsNumber != null &&
    (Number.isNaN(flowRateAsNumber) ||
      flowRateAsNumber < minFlowRate ||
      flowRateAsNumber > maxFlowRate)
      ? t(`value_out_of_range`, {
          min: minFlowRate,
          max: maxFlowRate,
        })
      : null

  const handleFlowRateChange = (input: string): void => {
    const isValidInput = isValidNumericalInput(input, { allowDecimal: true })
    if (isValidInput === false) {
      return
    }
    setFlowRate(input)
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={headerCopy}
        buttonText={i18n.format(t('shared:save'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickSave}
        top={SPACING.spacing8}
        buttonIsDisabled={error != null || flowRate === ''}
      />
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
          <TouchInputField
            autoFocus
            type="text"
            value={flowRate}
            label={textEntryCopy}
            error={error}
            onChange={e => {
              handleFlowRateChange(e.target.value as string)
            }}
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
          borderRadius="0"
        >
          <StatelessNumericalKeyboard
            value={flowRate}
            isDecimal
            onChange={handleFlowRateChange}
          />
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
