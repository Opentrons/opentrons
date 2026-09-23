import { useRef, useState } from 'react'
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

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { parseNumericalInput } from '/app/organisms/ODD/utils/parseNumericalInput'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch } from 'react'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface TipPositionEntryProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind // TODO: rename flowRateKind to be generic
}

export function TipPositionEntry(props: TipPositionEntryProps): JSX.Element {
  const { onBack, state, dispatch, kind } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)
  const inputElementRef = useRef<HTMLInputElement>(null)

  const [tipPosition, setTipPosition] = useState<string>(
    String(
      kind === 'aspirate'
        ? state.tipPositionAspirate
        : state.tipPositionDispense
    )
  )

  let wellHeight = 1
  if (kind === 'aspirate') {
    wellHeight = Math.max(
      ...state.sourceWells.map(well =>
        state.source != null ? state.source.wells[well].depth : 0
      )
    )
  } else if (kind === 'dispense') {
    const destLabwareDefinition =
      state.destination === 'source' ? state.source : state.destination
    wellHeight = Math.max(
      ...state.destinationWells.map(well =>
        destLabwareDefinition != null
          ? destLabwareDefinition.wells[well].depth
          : 0
      )
    )
  }

  // the maxiumum allowed position is 2mm above the height of the well
  // this currently assumes bottom position reference
  const tipPositionRange = { min: 1, max: Math.floor(wellHeight + 2) } // TODO: set this based on range

  const textEntryCopy: string = t('distance_bottom_of_well_mm')
  const tipPositionAction =
    kind === 'aspirate'
      ? ACTIONS.SET_ASPIRATE_TIP_POSITION
      : ACTIONS.SET_DISPENSE_TIP_POSITION

  const parsedTipPosition = parseNumericalInput(tipPosition, {
    allowDecimal: false,
    allowNegative: false,
    min: tipPositionRange.min,
    max: tipPositionRange.max,
  })

  const handleClickSave = (): void => {
    if (parsedTipPosition.result === 'success') {
      dispatch({
        type: tipPositionAction,
        position: parsedTipPosition.data,
      })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `TipPosition_${kind}`,
        },
      })
    }
    onBack()
  }

  const tipPositionErrorMessage =
    parsedTipPosition.result === 'rangeError'
      ? t('value_out_of_range', {
          min: Math.floor(parsedTipPosition.min),
          max: Math.floor(parsedTipPosition.max),
        })
      : parsedTipPosition.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('aspirate_tip_position')
            : t('dispense_tip_position')
        }
        buttonText={t('shared:save')}
        onClickBack={onBack}
        onClickButton={handleClickSave}
        top={SPACING.spacing8}
        buttonIsDisabled={parsedTipPosition.result !== 'success'}
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
            ref={inputElementRef}
            autoFocus
            type="text"
            value={tipPosition}
            label={textEntryCopy}
            error={tipPositionErrorMessage}
            onChange={e => {
              setTipPosition(e.target.value)
            }}
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
            inputElementRef={inputElementRef}
          />
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
