import { Controller } from 'react-hook-form'
import { Sketch } from '@uiw/react-color'

import { Flex, POSITION_ABSOLUTE } from '@opentrons/components'
import { DEFAULT_LIQUID_COLORS } from '@opentrons/shared-data'

import type { ColorResult } from '@uiw/react-color'
import type { ReactNode, RefObject } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import type { Ingredient } from '@opentrons/step-generation'

interface LiquidColorPickerProps {
  chooseColorWrapperRef: RefObject<HTMLDivElement>
  control: Control<Ingredient, any>
  color: string
  setValue: UseFormSetValue<Ingredient>
}

export function LiquidColorPicker({
  chooseColorWrapperRef,
  control,
  color,
  setValue,
}: LiquidColorPickerProps): ReactNode {
  return (
    <Flex
      position={POSITION_ABSOLUTE}
      left="4.375rem"
      top="4.6875rem"
      ref={chooseColorWrapperRef}
      zIndex={2}
    >
      <Controller
        name="displayColor"
        control={control}
        render={({ field }) => (
          <Sketch
            presetColors={DEFAULT_LIQUID_COLORS}
            color={color}
            onChange={(color: ColorResult) => {
              setValue('displayColor', color.hexa)
              field.onChange(color.hexa)
            }}
          />
        )}
      />
    </Flex>
  )
}
