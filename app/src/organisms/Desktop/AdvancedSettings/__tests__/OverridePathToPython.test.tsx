import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { i18n } from '/app/i18n'
import { getPathToPythonOverride } from '/app/redux/config'
import {
  useTrackEvent,
  ANALYTICS_CHANGE_PATH_TO_PYTHON_DIRECTORY,
} from '/app/redux/analytics'
import { renderWithProviders } from '/app/__testing-utils__'
import { openPythonInterpreterDirectory } from '/app/redux/protocol-analysis'

import { OverridePathToPython } from '../OverridePathToPython'

vi.mock('/app/redux/config')
vi.mock('/app/redux/analytics')
vi.mock('/app/redux/protocol-analysis')

const render = () => {
  return (
    renderWithProviders(<OverridePathToPython />),
    {
      i18nInstance: i18n,
    }
  )
}

const mockTrackEvent = vi.fn()

describe('OverridePathToPython', () => {
  beforeEach(() => {
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
  })
  it('renders the path to python override text and button with no default path', () => {
    vi.mocked(getPathToPythonOverride).mockReturnValue(null)
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
    vi.mocked(getPathToPythonOverride).mockReturnValue('otherPath')
    render()
    screen.getByText('Override Path to Python')
    screen.getByText(
      'If specified, the Opentrons App will use the Python interpreter at this path instead of the default bundled Python interpreter.'
    )
    screen.getByText('override path')
    const specifiedPath = screen.getByText('otherPath')
    const button = screen.getByRole('button', { name: 'Reset to default' })
    fireEvent.click(button)
    expect(vi.mocked(getPathToPythonOverride)).toHaveBeenCalled()
    fireEvent.click(specifiedPath)
    expect(vi.mocked(openPythonInterpreterDirectory)).toHaveBeenCalled()
  })
})
