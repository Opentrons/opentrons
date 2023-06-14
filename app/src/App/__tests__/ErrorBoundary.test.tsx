import * as React from 'react'
import { render, screen } from '@testing-library/react'

import { ErrorBoundary } from '../ErrorBoundary'

const ErrorChild = () => {
  throw new Error('Something went wrong')
}

const ChildWithoutError = () => {
  return <div>Component without error</div>
}

describe('ErrorBoundary', () => {
  it('should render text when an error happens', () => {
    render(
      <ErrorBoundary>
        <ErrorChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Reload the app')).toBeInTheDocument()
  })

  it('should render text when an error does not happen', () => {
    render(
      <ErrorBoundary>
        <ChildWithoutError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Component without error')).toBeInTheDocument()
  })
})
