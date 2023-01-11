import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { restartRobot } from '../../../redux/robot-admin'
import { CompleteUpdateSoftware } from '../CompleteUpdateSoftware'

jest.mock('../../../redux/robot-admin')

const mockRestartRobot = restartRobot as jest.MockedFunction<
  typeof restartRobot
>

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

  it('should render text, progress bar and button ', () => {
    const [{ getByText, getByRole, getByTestId }] = render(props)
    getByText('Update complete!')
    getByRole('button', { name: 'Restart robot' })
    const bar = getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 100%')
  })

  it('should call mock function when tapping Restart robot', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button', { name: 'Restart robot' })
    fireEvent.click(button)
    expect(mockRestartRobot).toBeCalled()
  })

  // ToDo kj 1/10/2023 update config case will be added in another PR
  // This is for resuming the initial setup process after restart robot
  // it('should call mock update config when restart robot', () => {})
})
