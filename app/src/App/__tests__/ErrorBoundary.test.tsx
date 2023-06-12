import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { ErrorBoundary } from '../ErrorBoundary'

const ErrorChild = () => {
  throw new Error('Something went wrong')
}

const ChildWithoutError: React.ReactNode = () => {
  return <div>Component without error</div>
}

const render = (props: React.ComponentProps<typeof ErrorBoundary>) => {
  return renderWithProviders(<ErrorBoundary {...props} />)
}

describe('ErrorBoundary', () => {
  let props: React.ComponentProps<typeof ErrorBoundary>

  beforeEach(() => {
    props = {
      children: ErrorChild,
    }
  })

  it('should render text', () => {
    const [{ getByText }] = render(props)
    getByText('Something went wrong')
  })

  it('should render text', () => {
    props = { children: ChildWithoutError }
    const [{ queryByText }] = render(props)
    expect(queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
