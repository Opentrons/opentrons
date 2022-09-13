import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { ConfirmExit } from '../ConfirmExit'

describe('ConfirmExit', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ConfirmExit>>
  ) => ReturnType<typeof renderWithProviders>

  const mockBack = jest.fn()
  const mockExit = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm exit calls exit', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'exit' }).click()
    expect(mockExit).toHaveBeenCalled()
  })

  it('clicking back calls back', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Go back' }).click()
    expect(mockBack).toHaveBeenCalled()
  })

  it('renders body and heading text if present', () => {
    const { getByRole, getByText } = render({
      heading: 'fake heading',
      body: 'fake body',
    })[0]
    getByRole('heading', { name: 'fake heading' })
    getByText('fake heading')
  })
})
