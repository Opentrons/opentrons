import {
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { memoize } from 'lodash'
import upperFirst from 'lodash/upperFirst'
import * as React from 'react'
import { RichOptions } from '../fields'

export interface PipetteOptionRowProps {
  disabled?: boolean
  isMultiChannel: boolean
  loadName: string
}
export const PipetteOptionRow = (props: PipetteOptionRowProps): JSX.Element => {
  const pName = upperFirst(props.loadName.split('_')[0]) // Eg, "P300"
  const gen = props.loadName.endsWith('_gen2') ? 'GEN2' : 'GEN1'

  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <>
      {props.disabled === true && (
        <Tooltip {...tooltipProps}>
          Labware is incompatible with 8-Channel pipettes
        </Tooltip>
      )}
      <Flex
        {...targetProps}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="15rem"
      >
        <Box flex={1}>{pName}</Box>
        <Box flex={2}>
          {props.isMultiChannel ? '8-Channel' : 'Single-Channel'}
        </Box>
        <Box flex={1}>{gen}</Box>
      </Flex>
    </>
  )
}

interface Pipette {
  tiprack: string
  isMultiChannel: boolean
}

export const pipettes: Record<string, Pipette> = {
  p20_single_gen2: {
    tiprack: 'opentrons_96_tiprack_20ul',
    isMultiChannel: false,
  },
  p20_multi_gen2: {
    tiprack: 'opentrons_96_tiprack_20ul',
    isMultiChannel: true,
  },
  p300_single_gen2: {
    tiprack: 'opentrons_96_tiprack_300ul',
    isMultiChannel: false,
  },
  p300_multi_gen2: {
    tiprack: 'opentrons_96_tiprack_300ul',
    isMultiChannel: true,
  },
  p1000_single_gen2: {
    tiprack: 'opentrons_96_tiprack_1000ul',
    isMultiChannel: false,
  },
  p1000_multi_gen2: {
    tiprack: 'opentrons_96_tiprack_1000ul',
    isMultiChannel: true,
  },
  p10_single: {
    tiprack: 'opentrons_96_tiprack_20ul',
    isMultiChannel: false,
  },
  p10_multi: {
    tiprack: 'opentrons_96_tiprack_20ul',
    isMultiChannel: true,
  },
  p50_single: {
    tiprack: 'opentrons_96_tiprack_300ul',
    isMultiChannel: false,
  },
  p50_multi: {
    tiprack: 'opentrons_96_tiprack_300ul',
    isMultiChannel: true,
  },
  p300_single: {
    tiprack: 'opentrons_96_tiprack_300ul',
    isMultiChannel: false,
  },
  p300_multi: {
    tiprack: 'opentrons_96_tiprack_300ul',
    isMultiChannel: true,
  },
  p1000_single: {
    tiprack: 'opentrons_96_tiprack_1000ul',
    isMultiChannel: false,
  },
  p1000_multi: {
    tiprack: 'opentrons_96_tiprack_1000ul',
    isMultiChannel: true,
  },
}

const _getPipetteNameOptions = (allowMultiChannel: boolean): RichOptions =>
  Object.keys(pipettes).map(loadName => {
    const pipette = pipettes[loadName]

    const disabled = pipette.isMultiChannel ? !allowMultiChannel : false

    return {
      name: (
        <PipetteOptionRow
          disabled={disabled}
          isMultiChannel={pipette.isMultiChannel}
          loadName={loadName}
        />
      ),
      value: loadName,
      disabled,
    }
  })

export const getPipetteNameOptions = memoize(_getPipetteNameOptions)
