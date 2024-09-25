import type { ChangeEventHandler, ReactNode, ComponentProps } from 'react'
import { RadioGroup, SPACING, Flex } from '@opentrons/components'

// note: this typescript stuff is so that e.currentTarget.value in the ChangeEventHandler
// is deduced to a union of the values of the options passed to the radiogroup rather than
// just string
export interface Target<T> extends Omit<HTMLInputElement, 'value'> {
  value: T
}

export type Options<T extends string = never> = Array<{
  value: T
  children: ReactNode
}>

export interface RecoveryRadioGroupProps<T extends string>
  extends Omit<
    ComponentProps<typeof RadioGroup>,
    'labelTextClassName' | 'options' | 'onchange'
  > {
  options: Options<T>
  onChange: ChangeEventHandler<Target<T>>
}

export function RecoveryRadioGroup<T extends string>(
  props: RecoveryRadioGroupProps<T>
): JSX.Element {
  return (
    <RadioGroup
      {...props}
      options={props.options.map(radioOption => ({
        name: '',
        value: radioOption.value,
        children: (
          <Flex marginY={SPACING.spacing4}>{radioOption.children}</Flex>
        ),
      }))}
    />
  )
}
