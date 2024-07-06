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

import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  FlowRateKind,
} from '../types'

import { ACTIONS } from '../constants'
import { createPortal } from 'react-dom'

interface TipPositionEntryProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind // TODO: rename flowRateKind to be generic
}

export function TipPositionEntry(props: TipPositionEntryProps): JSX.Element {
  const { onBack, state, dispatch, kind } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const keyboardRef = React.useRef(null)

  const [tipPosition, setTipPosition] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.tipPositionAspirate
      : kind === 'dispense'
      ? state.tipPositionDispense
      : null
  )
  const tipPositionRange = { min: 1, max: 2 } // TODO: set this based on range

  let headerCopy: string = ''
  const textEntryCopy: string = t('distance_bottom_of_well_mm')
  let tipPositionAction:
    | typeof ACTIONS.SET_ASPIRATE_TIP_POSITION
    | typeof ACTIONS.SET_DISPENSE_TIP_POSITION
    | null = null
  if (kind === 'aspirate') {
    headerCopy = t('aspirate_tip_position')
    tipPositionAction = ACTIONS.SET_ASPIRATE_TIP_POSITION
  } else if (kind === 'dispense') {
    headerCopy = t('dispense_tip_position')
    tipPositionAction = ACTIONS.SET_DISPENSE_TIP_POSITION
  }

  const handleClickSave = (): void => {
    // the button will be disabled if this values is null
    if (tipPosition != null && tipPositionAction != null) {
      dispatch({
        type: tipPositionAction,
        position: tipPosition,
      })
    }
    onBack()
  }

  const error =
    tipPosition !== null &&
    (tipPosition < tipPositionRange.min || tipPosition > tipPositionRange.max)
      ? t(`value_out_of_range`, {
          min: tipPositionRange.min,
          max: tipPositionRange.max,
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
        buttonIsDisabled={error != null || tipPosition === null}
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
          <InputField
            type="text"
            value={tipPosition}
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
              setTipPosition(Number(e))
            }}
          />
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
