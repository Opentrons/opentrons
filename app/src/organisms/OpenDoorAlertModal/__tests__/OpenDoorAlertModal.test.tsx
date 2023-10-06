import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'

import { OpenDoorAlertModal } from '..'

const render = () => {
  return renderWithProviders(<OpenDoorAlertModal />, {
    i18nInstance: i18n,
  })
}

describe('OpenDoorAlertModal', () => {
  it('should render text', () => {
    const [{ getByText }] = render()
    getByText('Robot door is open')
    getByText('Close robot door to resume run')
  })
})
