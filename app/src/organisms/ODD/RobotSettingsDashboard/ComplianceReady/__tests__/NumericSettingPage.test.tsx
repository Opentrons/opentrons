import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { NumericSettingPage } from '../NumericSettingPage'

import type { ComponentProps } from 'react'

vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const render = (props: ComponentProps<typeof NumericSettingPage>): void => {
  renderWithProviders(<NumericSettingPage {...props} />, {
    i18nInstance: i18n,
  })
}

describe('NumericSettingPage', () => {
  let props: ComponentProps<typeof NumericSettingPage>

  beforeEach(() => {
    props = {
      title: 'Maximum login attempts',
      description: 'Maximum login attempts before account deactivation',
      value: 5,
      label: 'Number of logins',
      caption: 'Input range 1-5',
      min: 1,
      max: 5,
      onBack: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title, description, caption, and current value', () => {
    render(props)

    screen.getByText('Maximum login attempts')
    screen.getByText('Maximum login attempts before account deactivation')
    screen.getByText('Input range 1-5')
    expect(screen.getByLabelText('Number of logins')).toHaveValue('5')
    screen.getByText('mock numerical keyboard')
  })

  it('calls onBack with the current value when valid', () => {
    render(props)

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.onBack).toHaveBeenCalledWith(3)
  })

  it('shows a required error and does not call onBack when the value is empty', () => {
    props.value = null
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    screen.getByText('Please enter a number of logins')
    expect(props.onBack).not.toHaveBeenCalled()
  })

  it('shows a minimum error and does not call onBack', () => {
    render(props)

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    screen.getByText('Must be greater than 1')
    expect(props.onBack).not.toHaveBeenCalled()
  })

  it('shows a maximum error and does not call onBack', () => {
    render(props)

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '6' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    screen.getByText('Must be less than 5')
    expect(props.onBack).not.toHaveBeenCalled()
  })

  it('shows a C int maximum error for oversized values', () => {
    props.max = undefined
    render(props)

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '2147483648' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    screen.getByText('Must be less than 2147483647')
    expect(props.onBack).not.toHaveBeenCalled()
  })

  it('clears the error when the value changes', () => {
    render(props)

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    screen.getByText('Must be greater than 1')

    fireEvent.change(screen.getByLabelText('Number of logins'), {
      target: { value: '2' },
    })
    expect(screen.queryByText('Must be greater than 1')).not.toBeInTheDocument()
  })
})
