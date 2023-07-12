import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { LabeledValue } from '../LabeledValue'

const render = (props: React.ComponentProps<typeof LabeledValue>) => {
  return renderWithProviders(<LabeledValue {...props} />)
}

describe('LabeledValue', () => {
  let props: React.ComponentProps<typeof LabeledValue>
  beforeEach(() => {
    props = {
      label: 'height',
      value: '42',
    }
  })

  it('renders correct label heading', () => {
    const [{ getByRole }] = render(props)

    getByRole('heading', { name: 'height' })
  })

  it('renders correct value when value is a string', () => {
    const [{ getByText }] = render(props)

    getByText('42')
  })

  it('renders correct value when value is a number', () => {
    props.value = 43
    const [{ getByText }] = render(props)

    getByText('43')
  })
})
