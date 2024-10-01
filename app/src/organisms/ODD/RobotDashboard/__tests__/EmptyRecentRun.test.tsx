import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { EmptyRecentRun } from '../EmptyRecentRun'

const PNG_FILE_NAME =
  '/app/src/assets/images/on-device-display/empty_protocol_dashboard.png'

const render = () => {
  return renderWithProviders(<EmptyRecentRun />, {
    i18nInstance: i18n,
  })
}

describe('EmptyRecentRun', () => {
  it('should render image and text', () => {
    render()
    screen.getByAltText('No recent runs')
    screen.getByText('No recent runs')
    screen.getByText('After you run some protocols, they will appear here.')
    const image = screen.getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })
})
