import type * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ErrorUpdateSoftware } from '../ErrorUpdateSoftware'

const render = (props: React.ComponentProps<typeof ErrorUpdateSoftware>) => {
  return renderWithProviders(<ErrorUpdateSoftware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ErrorUpdateSoftware', () => {
  let props: React.ComponentProps<typeof ErrorUpdateSoftware>

  beforeEach(() => {
    props = {
      errorMessage: 'mock error message',
      children: (
        <div>
          <h1>{'mock child'}</h1>
        </div>
      ),
    }
  })

  it('should render text', () => {
    render(props)
    screen.getByText('Software update error')
    screen.getByText('mock error message')
  })
  it('should render provided children', () => {
    render(props)
    screen.getByText('mock child')
  })
})
