import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { getPathToPythonOverride } from '../../../redux/config'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
} from '../../../redux/analytics'
import { openPythonInterpreterDirectory } from '../../../redux/protocol-analysis'

import { OverridePathToPython } from '../OverridePathToPython'

jest.mock('../../../redux/config')
jest.mock('../../../redux/analytics')
jest.mock('../../../redux/protocol-analysis')

const render = () => {
  return (
    renderWithProviders(<OverridePathToPython />),
    {
      i18nInstance: i18n,
    }
  )
}

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockGetPathToPythonOverride = getPathToPythonOverride as jest.MockedFunction<
  typeof getPathToPythonOverride
>
const mockOpenPythonInterpreterDirectory = openPythonInterpreterDirectory as jest.MockedFunction<
  typeof openPythonInterpreterDirectory
>

const mockTrackEvent = jest.fn()

describe('OverridePathToPython', () => {
  beforeEach(() => {
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
  })
  it('renders the path to python override text and button with no default path', () => {
    mockGetPathToPythonOverride.mockReturnValue(null)
    render()
    screen.getByText('Override Path to Python')
    screen.getByText(
      'If specified, the Opentrons App will use the Python interpreter at this path instead of the default bundled Python interpreter.'
    )
    screen.getByText('override path')
    screen.getByText('No path specified')
    const button = screen.getByRole('button', { name: 'Add override path' })
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
      properties: {},
    })
  })

  it('renders the path to python override text and button with a selected path', () => {
    mockGetPathToPythonOverride.mockReturnValue('otherPath')
    render()
    screen.getByText('Override Path to Python')
    screen.getByText(
      'If specified, the Opentrons App will use the Python interpreter at this path instead of the default bundled Python interpreter.'
    )
    screen.getByText('override path')
    const specifiedPath = screen.getByText('otherPath')
    const button = screen.getByRole('button', { name: 'Reset to default' })
    fireEvent.click(button)
    expect(mockGetPathToPythonOverride).toHaveBeenCalled()
    fireEvent.click(specifiedPath)
    expect(mockOpenPythonInterpreterDirectory).toHaveBeenCalled()
  })
})
