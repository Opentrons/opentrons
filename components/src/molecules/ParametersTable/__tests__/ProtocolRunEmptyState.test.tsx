import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { ProtocolRunEmptyState } from '../ProtocolRunEmptyState'

const render = (props: React.ComponentProps<typeof ProtocolRunEmptyState>) => {
  return renderWithProviders(<ProtocolRunEmptyState {...props} />)
}

describe('NoParameters', () => {
  let props: React.ComponentProps<typeof ProtocolRunEmptyState>

  beforeEach(() => {
    props = {
      contentType: 'parameters',
    }
  })

  it('should render text and icon with proper color - parameters', () => {
    render(props)
    screen.getByLabelText('alert')
    screen.getByText('No parameters specified in this protocol')
  })

  it('should render text and icon with proper color - module controls', () => {
    props = {
      contentType: 'moduleControls',
    }
    render(props)
    screen.getByLabelText('alert')
    screen.getByText('Connect modules to see controls')
  })

  it('should have proper styles', () => {
    render(props)
    expect(screen.getByTestId('NoRunTimeParameter')).toHaveStyle(
      `background-color: ${COLORS.grey30}`
    )
    expect(screen.getByTestId('NoRunTimeParameter')).toHaveStyle(
      `border-radius: ${BORDERS.borderRadius8}`
    )
    expect(screen.getByLabelText('alert')).toHaveStyle(
      `color: ${COLORS.grey60}`
    )
  })
})
