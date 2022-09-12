import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { CompleteConfirmation } from '../CompleteConfirmation'

describe('CompleteConfirmation', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof CompleteConfirmation>>
  ) => ReturnType<typeof renderWithProviders>

  const mockCleanUpAndExit = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
      const { proceed = mockCleanUpAndExit, flowName, body, visualAid } = props
      return renderWithProviders(
        <CompleteConfirmation
          proceed={proceed}
          flowName={flowName}
          body={body}
          visualAid={visualAid}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue sends exit command and deletes session', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'exit' }).click()
    expect(mockCleanUpAndExit).toHaveBeenCalled()
  })

  it('renders heading and body text if present', () => {
    const { getByRole, getByText } = render({
      flowName: 'fake flow name',
      body: 'fake body text',
    })[0]

    getByRole('heading', { name: 'fake flow name complete!' })
    getByText('fake body text')
  })

  it('renders visual aid in place of icon if present', () => {
    const { getByText } = render({ visualAid: 'fake visual aid' })[0]
    getByText('fake visual aid')
  })
})
