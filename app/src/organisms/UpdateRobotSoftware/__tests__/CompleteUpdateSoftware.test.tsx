import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CompleteUpdateSoftware } from '../CompleteUpdateSoftware'

jest.mock('../../../redux/robot-admin')

const render = (props: React.ComponentProps<typeof CompleteUpdateSoftware>) => {
  return renderWithProviders(<CompleteUpdateSoftware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CompleteUpdateSoftware', () => {
  let props: React.ComponentProps<typeof CompleteUpdateSoftware>

  beforeEach(() => {
    props = {
      robotName: 'otie',
    }
  })

  it('should render text, progress bar and button', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Update complete!')
    getByText('Install complete, robot restarting...')
    const bar = getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 100%')
  })
})
