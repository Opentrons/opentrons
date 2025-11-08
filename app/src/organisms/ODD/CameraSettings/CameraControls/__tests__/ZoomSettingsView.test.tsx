import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ZoomSettingsView } from '../ZoomSettingsView'

import type { ZoomSettingsViewProps } from '../ZoomSettingsView'

vi.mock('/app/organisms/ODD/ChildNavigation')

const render = (props: ZoomSettingsViewProps) => {
  return renderWithProviders(<ZoomSettingsView {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ZoomSettingsView', () => {
  let mockProps: ZoomSettingsViewProps

  beforeEach(() => {
    mockProps = {
      zoomValue: '1x',
      adjustZoom: vi.fn(),
      returnToHomeView: vi.fn(),
    }
    vi.mocked(ChildNavigation).mockReturnValue(<div>MOCK_CHILD_NAVIGATION</div>)
  })

  it('renders ChildNavigation with correct header', () => {
    render(mockProps)

    expect(vi.mocked(ChildNavigation)).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Zoom',
      }),
      {}
    )
  })

  it('calls returnToHomeView when back button is clicked', () => {
    vi.mocked(ChildNavigation).mockImplementation(({ onClickBack }) => (
      <button onClick={onClickBack} data-testid="back-button">
        Back
      </button>
    ))

    render(mockProps)

    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)

    expect(mockProps.returnToHomeView).toHaveBeenCalledTimes(1)
  })

  it('renders description text', () => {
    render(mockProps)

    screen.getByText('Adjust how close or far the deck appears.')
  })

  it('renders all three zoom radio buttons', () => {
    render(mockProps)

    screen.getByText('1x')
    screen.getByText('1.5x')
    screen.getByText('2x')
  })

  it('renders correct sublabels for zoom options', () => {
    render(mockProps)

    screen.getByText('Default')
    screen.getByText('Moderate')
    screen.getByText('Maximum')
  })
})
