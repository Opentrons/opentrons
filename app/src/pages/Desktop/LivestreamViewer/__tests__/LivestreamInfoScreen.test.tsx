import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { LivestreamInfoScreen } from '../LivestreamInfoScreen'

const render = (
  type: React.ComponentProps<typeof LivestreamInfoScreen>['type']
) => {
  return renderWithProviders(<LivestreamInfoScreen type={type} />, {
    i18nInstance: i18n,
  })
}

describe('LivestreamInfoScreen', () => {
  it('renders loading state', () => {
    render('loading')
    screen.getByText('Camera loading')
  })

  it('renders error state', () => {
    render('error')
    screen.getByText('Camera failed to load')
    screen.getByText('Relaunch the camera to try again.')
  })

  it('renders disabled state', () => {
    render('disabled')
    screen.getByText('Live video disabled for this run')
  })

  it('renders run-terminal state', () => {
    render('run-terminal')
    screen.getByText('Live video has ended')
  })
})
