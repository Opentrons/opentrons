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

import type { SmallButton } from '../../../atoms/buttons'
import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
} from '../types'
import { createPortal } from 'react-dom'


interface FlowRateEntryProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function FlowRateEntry(props: FlowRateEntryProps): JSX.Element {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const keyboardRef = React.useRef(null)

  const [flowRate, setFlowRate] = React.useState<string>(
    state.aspirateFlowRate ? state.aspirateFlowRate.toString() : ''
    // TODO: need to take into account aspirate and dispense
  )
  const flowRateRange = getFlowRateRange(state)
  let headerCopy = t('aspirate_flow_rate')
  let textEntryCopy = t('aspirate_flow_rate_µL')
  const rateAsNumber = Number(flowRate)

  const handleClickSave = (): void => {
    // the button will be disabled if this values is null
    if (rateAsNumber != null) {
      dispatch({
        // set the type based on aspirate or dispense component.
        type: 'SET_ASPIRATE_FLOW_RATE',
        rate: rateAsNumber,
      })
      onNext()
    }
  }

  const error =
    flowRate !== '' &&
    (rateAsNumber < flowRateRange.min || rateAsNumber > flowRateRange.max)
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
        secondaryButtonProps={exitButtonProps}
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
          <InputField
            type="text"
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
              setFlowRate(e)
            }}
          />
        </Flex>
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
