import * as React from 'react'
import { Mount, Flex, DIRECTION_COLUMN } from '@opentrons/components'
import { TiprackOption } from './TiprackOption'
import { FormPipettesByMount } from '../../../step-forms'

import type { TiprackOption as TiprackOptionType } from '../utils'

interface TiprackSelectProps {
  mount: Mount
  tiprackOptions: TiprackOptionType[]
  onSetFieldValue: (field: string, value: any) => void
  values: FormPipettesByMount
}
export const TiprackSelect = (
  props: TiprackSelectProps
): JSX.Element | null => {
  const { mount, tiprackOptions, values, onSetFieldValue } = props
  const selectedPipetteName = values[mount].pipetteName

  const nameAccessor = `pipettesByMount.${mount}.tiprackDefURI`
  let selectedValues = values[mount].tiprackDefURI ?? []

  React.useEffect(() => {
    if (selectedValues?.length === 0 && tiprackOptions.length > 0) {
      selectedValues = [tiprackOptions[0].value]
      onSetFieldValue(nameAccessor, selectedValues)
    }
  }, [selectedValues, onSetFieldValue, nameAccessor, tiprackOptions])

  return selectedPipetteName != null ? (
    <Flex height="15rem" overflowY="scroll" flexDirection={DIRECTION_COLUMN}>
      {tiprackOptions.map(option => (
        <TiprackOption
          isSelected={selectedValues.includes(option.value)}
          key={option.name}
          text={option.name}
          onClick={() => {
            const updatedValues = selectedValues?.includes(option.value)
              ? selectedValues.filter(value => value !== option.value)
              : [...(selectedValues ?? []), option.value]
            onSetFieldValue(nameAccessor, updatedValues.slice(0, 3))
          }}
        />
      ))}
    </Flex>
  ) : null
}
