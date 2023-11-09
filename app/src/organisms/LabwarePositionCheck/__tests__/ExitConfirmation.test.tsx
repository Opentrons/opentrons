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
      shouldUseMetalProbe: false,
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
    getByRole('button', { name: 'Exit' })
    getByRole('button', { name: 'Go back' })
  })
  it('should invoke callback props when ctas are clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Go back' }).click()
    expect(props.onGoBack).toHaveBeenCalled()
    getByRole('button', { name: 'Exit' }).click()
    expect(props.onConfirmExit).toHaveBeenCalled()
  })
  it('should render correct copy for golden tip LPC', () => {
    const { getByText, getByRole } = render({
      ...props,
      shouldUseMetalProbe: true,
    })
    getByText('Remove the calibration probe before exiting')
    getByText(
      'If you exit now, all labware offsets will be discarded. This cannot be undone.'
    )
    getByRole('button', { name: 'Remove calibration probe' })
    getByRole('button', { name: 'Go back' })
  })
})
