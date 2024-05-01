import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { BORDERS, COLORS } from '../../../helix-design-system'
import { InfoScreen } from '../InfoScreen'

const render = (props: React.ComponentProps<typeof InfoScreen>) => {
  return renderWithProviders(<InfoScreen {...props} />)
}

describe('InfoScreen', () => {
  let props: React.ComponentProps<typeof InfoScreen>

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

  it('should render text and icon with proper color - run not started', () => {
    props = {
      contentType: 'runNotStarted',
    }
    render(props)
    screen.getByLabelText('alert')
    screen.getByText('Run was never started')
  })

  it('should render text and icon with proper color - labware', () => {
    props = {
      contentType: 'labware',
    }
    render(props)
    screen.getByLabelText('alert')
    screen.getByText('No labware specified in this protocol')
  })

  it('should have proper styles', () => {
    render(props)
    expect(screen.getByTestId('InfoScreen_parameters')).toHaveStyle(
      `background-color: ${COLORS.grey30}`
    )
    expect(screen.getByTestId('InfoScreen_parameters')).toHaveStyle(
      `border-radius: ${BORDERS.borderRadius8}`
    )
    expect(screen.getByLabelText('alert')).toHaveStyle(
      `color: ${COLORS.grey60}`
    )
  })
})
