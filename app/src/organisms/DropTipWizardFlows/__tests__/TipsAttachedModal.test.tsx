import React from 'react'
import NiceModal from '@ebay/nice-modal-react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { handleTipsAttachedModal } from '../TipsAttachedModal'
import { LEFT } from '@opentrons/shared-data'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { useCloseCurrentRun } from '../../ProtocolUpload/hooks'
import { useDropTipWizardFlows } from '..'

import type { PipetteModelSpecs } from '@opentrons/shared-data'
import type { HostConfig } from '@opentrons/api-client'
import type { Mock } from 'vitest'
import type { PipetteWithTip } from '..'

vi.mock('../../ProtocolUpload/hooks')
vi.mock('..')

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const ninetySixSpecs = {
  ...MOCK_ACTUAL_PIPETTE,
  channels: 96,
} as PipetteModelSpecs

const MOCK_PIPETTES_WITH_TIP: PipetteWithTip[] = [
  { mount: LEFT, specs: MOCK_ACTUAL_PIPETTE },
]
const MOCK_96_WITH_TIP: PipetteWithTip[] = [
  { mount: LEFT, specs: ninetySixSpecs },
]

const mockSetTipStatusResolved = vi.fn()
const MOCK_HOST: HostConfig = { hostname: 'MOCK_HOST' }

const render = (pipettesWithTips: PipetteWithTip[]) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <button
        onClick={() =>
          handleTipsAttachedModal({
            host: MOCK_HOST,
            pipettesWithTip: pipettesWithTips,
            setTipStatusResolved: mockSetTipStatusResolved,
          })
        }
        data-testid="testButton"
      />
    </NiceModal.Provider>,
    {
      i18nInstance: i18n,
    }
  )
}

let mockToggleDTWiz: Mock

describe('TipsAttachedModal', () => {
  mockToggleDTWiz = vi.fn()

  beforeEach(() => {
    vi.mocked(useCloseCurrentRun).mockReturnValue({
      closeCurrentRun: vi.fn(),
    } as any)
    vi.mocked(useDropTipWizardFlows).mockReturnValue({
      showDTWiz: false,
      toggleDTWiz: mockToggleDTWiz,
    })
  })

  it('renders appropriate warning given the pipette mount', () => {
    render(MOCK_PIPETTES_WITH_TIP)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    screen.getByText('Tips are attached')
    screen.queryByText(`${LEFT} Pipette`)
  })
  it('clicking the skip button properly closes the modal', () => {
    render(MOCK_PIPETTES_WITH_TIP)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = screen.getByText('Skip')
    fireEvent.click(skipBtn)
    expect(mockSetTipStatusResolved).toHaveBeenCalled()
  })
  it('clicking the launch wizard button properly launches the wizard', () => {
    render(MOCK_PIPETTES_WITH_TIP)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    const beginRemoval = screen.getByText('Begin removal')
    fireEvent.click(beginRemoval)
    expect(mockToggleDTWiz).toHaveBeenCalled()
  })
  it('renders special text when the pipette is a 96-Channel', () => {
    render(MOCK_96_WITH_TIP)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)
  })
})
