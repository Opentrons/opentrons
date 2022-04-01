import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { InputField } from '..'

const render = (props: React.ComponentProps<typeof InputField>) => {
  return renderWithProviders(<InputField {...props} />)[0]
}

describe('HeaterShakerSlideout', () => {
  let props: React.ComponentProps<typeof InputField>
  beforeEach(() => {
    props = {
      type: 'number',
      caption: 'caption',
      secondaryCaption: 'secondary caption',
      max: 10,
      min: 1,
      units: 'RPM',
      value: '5',
      disabled: false,
      onFocus: jest.fn(),
      onBlur: jest.fn(),
      onChange: jest.fn(),
      readOnly: false,
      autoFocus: false,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct information when type is number', () => {
    const { getByText } = render(props)
    getByText('caption')
    getByText('secondary caption')
    getByText('RPM')
  })
  it('renders correct information when type is text', () => {
    props = {
      type: 'text',
      value: 'string',
      units: 'C',
      onChange: jest.fn(),
    }
    const { getByText } = render(props)
    getByText('C')
  })
  it('renders error message when value is outside of number type range', () => {
    props = {
      type: 'number',
      caption: 'caption',
      max: 10,
      min: 1,
      units: 'RPM',
      value: '9',
      error: 'error',
      onChange: jest.fn(),
      id: 'input_id',
    }
    const { getByText, getByTestId } = render(props)
    const input = getByTestId('input_id')
    fireEvent.change(input, { target: { value: ['12'] } })
    expect(props.onChange).toHaveBeenCalled()
    getByText('error')
  })
})
