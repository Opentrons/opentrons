import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { SummaryAndSettings } from '../SummaryAndSettings'
import { Overview } from '../Overview'

vi.mock('../Overview')

const render = (props: React.ComponentProps<typeof SummaryAndSettings>) => {
  return renderWithProviders(<SummaryAndSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SummaryAndSettings', () => {
  let props: React.ComponentProps<typeof SummaryAndSettings>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {
        volume: 25,
      },
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the header and buttons for the summary and settings screen', () => {
    render(props)
    screen.getByText('Quick Transfer 25µL')
    const exitBtn = screen.getByText('Exit')
    fireEvent.click(exitBtn)
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
    screen.getByText('Create transfer')
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    fireEvent.click(continueBtn)
    expect(props.onNext).toHaveBeenCalled()
  })
  it('renders the three tabs and shows overview screen by default', () => {
    render(props)
    screen.getByText('Overview')
    screen.getByText('Advanced settings')
    screen.getByText('Tip management')
    expect(vi.mocked(Overview)).toHaveBeenCalled()
  })
})
