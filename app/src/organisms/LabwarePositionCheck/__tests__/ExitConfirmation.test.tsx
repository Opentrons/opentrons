import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { ExitConfirmation } from '../ExitConfirmation'
import { i18n } from '../../../i18n'

const render = (props: React.ComponentProps<typeof ExitConfirmation>) => {
  return renderWithProviders(<ExitConfirmation {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ExitConfirmation', () => {
  let props: React.ComponentProps<typeof ExitConfirmation>

  beforeEach(() => {
    props = {
      onGoBack: jest.fn(),
      onConfirmExit: jest.fn(),
    }
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should render correct copy', () => {
    const { getByText, getByRole } = render(props)
    getByText('Exit before completing Labware Position Check?')
    getByText(
      'If you exit now, all labware offsets will be discarded. This cannot be undone.'
    )
    getByRole('button', { name: 'exit' })
    getByRole('button', { name: 'Go back' })
  })
  it('should invoke callback props when ctas are clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Go back' }).click()
    expect(props.onGoBack).toHaveBeenCalled()
    getByRole('button', { name: 'exit' }).click()
    expect(props.onConfirmExit).toHaveBeenCalled()
  })
})
