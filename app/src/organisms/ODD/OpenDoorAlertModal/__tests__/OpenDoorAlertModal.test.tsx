import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { OpenDoorAlertModal } from '..'

const render = () => {
  return renderWithProviders(<OpenDoorAlertModal />, {
    i18nInstance: i18n,
  })
}

describe('OpenDoorAlertModal', () => {
  it('should render text', () => {
    render()
    screen.getByText('Robot door is open')
    screen.getByText('Close robot door to resume run')
  })
})
