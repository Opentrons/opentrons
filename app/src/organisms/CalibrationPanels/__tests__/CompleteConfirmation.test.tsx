import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { CompleteConfirmation } from '../CompleteConfirmation'

describe('CompleteConfirmation', () => {
  const mockCleanUpAndExit = jest.fn()
  const render = (
    props: Partial<React.ComponentProps<typeof CompleteConfirmation>> = {}
  ) => {
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

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue sends exit command and deletes session', () => {
    render()
    const button = screen.getByRole('button', { name: 'exit' })
    fireEvent.click(button)
    expect(mockCleanUpAndExit).toHaveBeenCalled()
  })

  it('renders heading and body text if present', () => {
    render({
      flowName: 'fake flow name',
      body: 'fake body text',
    })
    screen.getByRole('heading', { name: 'fake flow name complete!' })
    screen.getByText('fake body text')
  })

  it('renders visual aid in place of icon if present', () => {
    render({ visualAid: 'fake visual aid' })
    screen.getByText('fake visual aid')
  })
})
