// @flow
import * as React from 'react'

import { StackedLabeledControl } from './StackedLabeledControl'
import { RadioGroup } from '../forms'

import type { RadioGroupProps } from '../forms'

export type LabeledRadioGroupProps = {|
  ...RadioGroupProps,
  label: string,
  children: React.Node,
  'data-test'?: string,
|}

export function LabeledRadioGroup(props: LabeledRadioGroupProps): React.Node {
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
