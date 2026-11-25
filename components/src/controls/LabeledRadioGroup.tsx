import { RadioGroup } from '../forms'
import { StackedLabeledControl } from './StackedLabeledControl'

import type { ReactNode } from 'react'
import type { RadioGroupProps } from '../forms'

export interface LabeledRadioGroupProps extends RadioGroupProps {
  label: string
  children: ReactNode
  'data-test'?: string
}

export function LabeledRadioGroup(props: LabeledRadioGroupProps): ReactNode {
  const { label, value, options, onChange } = props

  return (
    <StackedLabeledControl
      label={label}
      control={
        <RadioGroup value={value} options={options} onChange={onChange} />
      }
    >
      {props.children}
    </StackedLabeledControl>
  )
}
