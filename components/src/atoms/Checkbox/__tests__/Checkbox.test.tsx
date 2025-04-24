import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { Checkbox } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof Checkbox>) => {
  return renderWithProviders(<Checkbox {...props} />)[0]
}

describe('Checkbox', () => {
  let props: ComponentProps<typeof Checkbox>

  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      isChecked: false,
      labelText: 'fake checkbox label',
      tabIndex: 1,
      disabled: false,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders label with disabled true', () => {
    props.disabled = true
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'fake checkbox label',
    })
    expect(checkBoxInput).toBeDisabled()
  })

  it('renders label with correct style - tabIndex 1', () => {
    props.tabIndex = 1
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'fake checkbox label',
    })
    expect(checkBoxInput).toHaveAttribute('tabindex', '1')
  })

  it('calls mock function when clicking checkbox', () => {
    render(props)
    const checkBoxInput = screen.getByRole('checkbox', {
      name: 'fake checkbox label',
    })
    fireEvent.click(checkBoxInput)
    expect(props.onClick).toHaveBeenCalled()
  })
})
