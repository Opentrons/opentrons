import React from 'react'
import NiceModal from '@ebay/nice-modal-react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { handleTipsAttachedModal } from '../TipsAttachedModal'
import { LEFT } from '@opentrons/shared-data'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { ROBOT_MODEL_OT3 } from '../../../redux/discovery'
import { useNotifyCurrentMaintenanceRun } from '../../../resources/maintenance_runs'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('../../../resources/maintenance_runs')
vi.mock('../../../resources/useNotifyService')

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const mockOnClose = vi.fn()
const MOCK_HOST: HostConfig = { hostname: 'MOCK_HOST' }

const render = (pipetteSpecs: PipetteModelSpecs) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <button
        onClick={() =>
          handleTipsAttachedModal(
            LEFT,
            pipetteSpecs,
            ROBOT_MODEL_OT3,
            MOCK_HOST,
            mockOnClose
          )
        }
        data-testid="testButton"
      />
    </NiceModal.Provider>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('TipsAttachedModal', () => {
  beforeEach(() => {
    vi.mocked(useNotifyCurrentMaintenanceRun).mockReturnValue({
      data: {
        data: {
          id: 'test',
        },
      },
    } as any)
  })

  it('renders appropriate warning given the pipette mount', () => {
    render(MOCK_ACTUAL_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    screen.getByText('Tips are attached')
    screen.queryByText(`${LEFT} Pipette`)
  })
  it('clicking the close button properly closes the modal', () => {
    render(MOCK_ACTUAL_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = screen.getByText('Skip')
    fireEvent.click(skipBtn)
    expect(mockOnClose).toHaveBeenCalled()
  })
  it('clicking the launch wizard button properly launches the wizard', () => {
    render(MOCK_ACTUAL_PIPETTE)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = screen.getByText('Begin removal')
    fireEvent.click(skipBtn)
    screen.queryByText('Drop tips')
  })
  it('renders special text when the pipette is a 96-Channel', () => {
    const ninetySixSpecs = {
      ...MOCK_ACTUAL_PIPETTE,
      channels: 96,
    } as PipetteModelSpecs

    render(ninetySixSpecs)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = screen.getByText('Begin removal')
    fireEvent.click(skipBtn)
    screen.queryByText('96-Channel')
  })
})
