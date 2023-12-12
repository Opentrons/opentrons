import React from 'react'
import NiceModal from '@ebay/nice-modal-react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { handleTipsAttachedModal } from '../TipsAttachedModal'
import { LEFT } from '@opentrons/shared-data'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { ROBOT_MODEL_OT3 } from '../../../redux/discovery'

import type { PipetteModelSpecs } from '@opentrons/shared-data'

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as PipetteModelSpecs

const mockOnClose = jest.fn()

const render = (pipetteSpecs: PipetteModelSpecs) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <button
        onClick={() =>
          handleTipsAttachedModal(
            LEFT,
            pipetteSpecs,
            ROBOT_MODEL_OT3,
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
  beforeEach(() => {})

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders appropriate warning given the pipette mount', () => {
    const [{ getByTestId, getByText, queryByText }] = render(
      MOCK_ACTUAL_PIPETTE
    )
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    getByText('Tips are attached')
    queryByText(`${LEFT} Pipette`)
  })
  it('clicking the close button properly closes the modal', () => {
    const [{ getByTestId, getByText }] = render(MOCK_ACTUAL_PIPETTE)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = getByText('Skip')
    fireEvent.click(skipBtn)
    expect(mockOnClose).toHaveBeenCalled()
  })
  it('clicking the launch wizard button properly launches the wizard', () => {
    const [{ getByTestId, getByText }] = render(MOCK_ACTUAL_PIPETTE)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = getByText('Begin removal')
    fireEvent.click(skipBtn)
    getByText('Drop tips')
  })
  it('renders special text when the pipette is a 96-Channel', () => {
    const ninetySixSpecs = {
      ...MOCK_ACTUAL_PIPETTE,
      displayName: 'Flex 96-Channel Pipette',
    } as PipetteModelSpecs

    const [{ getByTestId, getByText }] = render(ninetySixSpecs)
    const btn = getByTestId('testButton')
    fireEvent.click(btn)

    const skipBtn = getByText('Begin removal')
    fireEvent.click(skipBtn)
    getByText('Drop tips')
  })
})
