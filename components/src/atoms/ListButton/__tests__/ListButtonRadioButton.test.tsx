import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListButtonRadioButton } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ListButtonRadioButton>) =>
  renderWithProviders(<ListButtonRadioButton {...props} />)

describe('ListButtonRadioButton', () => {
  let props: ComponentProps<typeof ListButtonRadioButton>

  beforeEach(() => {
    props = {
      buttonText: 'mock text',
      buttonValue: 'mockValue',
      onChange: vi.fn(),
    }
  })

  it('should render non nested accordion', () => {
    render(props)
    fireEvent.click(screen.getByText('mock text'))
    expect(props.onChange).toHaveBeenCalled()
  })
})
