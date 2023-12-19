import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { ConfirmExit } from '../ConfirmExit'

describe('ConfirmExit', () => {
  const mockBack = jest.fn()
  const mockExit = jest.fn()
  const render = (
    props: Partial<React.ComponentProps<typeof ConfirmExit>> = {}
  ) => {
    const { heading, body } = props
    return renderWithProviders(
      <ConfirmExit
        exit={mockExit}
        back={mockBack}
        heading={heading}
        body={body}
      />,
      { i18nInstance: i18n }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm exit calls exit', () => {
    render()
    const button = screen.getByRole('button', { name: 'exit' })
    fireEvent.click(button)
    expect(mockExit).toHaveBeenCalled()
  })

  it('clicking back calls back', () => {
    render()
    const button = screen.getByRole('button', { name: 'Go back' })
    fireEvent.click(button)
    expect(mockBack).toHaveBeenCalled()
  })

  it('renders body and heading text if present', () => {
    render({
      heading: 'fake heading',
      body: 'fake body',
    })
    screen.getByRole('heading', { name: 'fake heading' })
    screen.getByText('fake heading')
  })
})
