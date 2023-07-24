import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ProgressBar } from '../../../atoms/ProgressBar'
import { UpdateInProgressModal } from '../UpdateInProgressModal'

jest.mock('../../../atoms/ProgressBar')

const mockProgressBar = ProgressBar as jest.MockedFunction<typeof ProgressBar>

const render = (props: React.ComponentProps<typeof UpdateInProgressModal>) => {
  return renderWithProviders(<UpdateInProgressModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateInProgressModal', () => {
  let props: React.ComponentProps<typeof UpdateInProgressModal>
  beforeEach(() => {
    props = {
      percentComplete: 12,
    }
    mockProgressBar.mockReturnValue('12' as any)
  })
  it('renders test and progress bar', () => {
    const { getByText } = render(props)
    getByText('Updating firmware...')
    getByText('12')
  })
})
