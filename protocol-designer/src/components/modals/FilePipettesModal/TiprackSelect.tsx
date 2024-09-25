import { useEffect } from 'react'
import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
import { TiprackOption } from './TiprackOption'
import type { Mount } from '@opentrons/components'
import type { FormPipettesByMount } from '../../../step-forms'
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

  let selectedValues = values[mount].tiprackDefURI ?? []

  useEffect(() => {
    if (selectedValues?.length === 0 && tiprackOptions.length > 0) {
      selectedValues = [tiprackOptions[0].value]
      onSetFieldValue(`pipettesByMount.${mount}.tiprackDefURI`, selectedValues)
    }
  }, [selectedValues, onSetFieldValue, tiprackOptions])

  if (selectedPipetteName == null) return null

  return (
    <Flex height="15rem" overflowY="scroll" flexDirection={DIRECTION_COLUMN}>
      {tiprackOptions.map((option, index) => (
        <Flex
          marginBottom={SPACING.spacing4}
          width="max-width"
          key={`${option.name}_${index}`}
          overflow="hidden"
        >
          <TiprackOption
            isDisabled={
              selectedValues?.length === 3 &&
              !selectedValues.includes(option.value)
            }
            isSelected={selectedValues.includes(option.value)}
            key={option.name}
            text={option.name}
            onClick={() => {
              const updatedValues = selectedValues?.includes(option.value)
                ? selectedValues.filter(value => value !== option.value)
                : [...(selectedValues ?? []), option.value]
              onSetFieldValue(
                `pipettesByMount.${mount}.tiprackDefURI`,
                updatedValues.slice(0, 3)
              )
            }}
          />
        </Flex>
      ))}
    </Flex>
  )
}
