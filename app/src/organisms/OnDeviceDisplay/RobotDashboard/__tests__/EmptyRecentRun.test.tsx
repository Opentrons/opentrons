import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { EmptyRecentRun } from '../EmptyRecentRun'

const PNG_FILE_NAME = 'empty_protocol_dashboard.png'

const render = () => {
  return renderWithProviders(<EmptyRecentRun />, {
    i18nInstance: i18n,
  })
}

describe('EmptyRecentRun', () => {
  it('should render image and text', () => {
    const [{ getByText, getByAltText, getByRole }] = render()
    getByAltText('No recent runs')
    getByText('No recent runs')
    getByText('After you run some protocols, they will appear here.')
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(PNG_FILE_NAME)
  })
})
