import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  getIsLabwareAboveHeight,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
} from '@opentrons/shared-data'
import i18next from 'i18next'

import { LabwareSelectionModal } from '../LabwareSelectionModal'

jest.mock('../../Hints/useBlockingHint')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getIsLabwareAboveHeight: jest.fn(),
  }
})

const mockGetIsLabwareAboveHeight = getIsLabwareAboveHeight as jest.MockedFunction<
  typeof getIsLabwareAboveHeight
>

const render = (props: React.ComponentProps<typeof LabwareSelectionModal>) => {
  return renderWithProviders(<LabwareSelectionModal {...props} />, {
    i18nInstance: i18next,
  })[0]
}

describe('LabwareSelectionModal', () => {
  let props: React.ComponentProps<typeof LabwareSelectionModal>
  beforeEach(() => {
    props = {
      onClose: jest.fn(),
      onUploadLabware: jest.fn(),
      selectLabware: jest.fn(),
      customLabwareDefs: {},
      permittedTipracks: [],
      isNextToHeaterShaker: false,
    }
  })
  it('should NOT filter out labware above 57 mm when the slot is NOT next to a heater shaker', () => {
    props.isNextToHeaterShaker = false
    render(props)
    expect(mockGetIsLabwareAboveHeight).not.toHaveBeenCalled()
  })
  it('should filter out labware above 57 mm when the slot is next to a heater shaker', () => {
    props.isNextToHeaterShaker = true
    render(props)
    expect(mockGetIsLabwareAboveHeight).toHaveBeenCalledWith(
      expect.any(Object),
      MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
    )
  })
})
