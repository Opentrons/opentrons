import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { AssignLiquidsModal } from '../..'

import type { ComponentProps } from 'react'
import { useSelector } from 'react-redux'
import { fixture96Plate, LabwareDefinition2 } from '@opentrons/shared-data'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('react-redux', async () => {
    const actual = await vi.importActual('react-redux')
    return {
      ...actual,
      useSelector: vi.fn(),
    }
  })

const render = (props: ComponentProps<typeof AssignLiquidsModal>) => {
  return renderWithProviders(<AssignLiquidsModal {...props} />, {
    i18nInstance: i18n,
  })
}

const mockAppState = {
    labwareInvariantProperties:
      {
        mockLabwareId: {
        stack: ['mockLabwareId'],
        id: 'mockLabwareId',
        labwareDefURI: 'mockUri',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
      },
    },
    containers: {
      mockLabwareId: {
        stack: ['mockLabwareId'],
        id: 'mockLabwareId',
        labwareDefURI: 'mockUri',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
      },
    },
    // ... other parts of your state
  };

describe('AssignLiquidsModal', () => {
  let props: ComponentProps<typeof AssignLiquidsModal>
  beforeEach(() => {
    props = {
      showLiquidOverflowMenu: vi.fn(),
      setDefineLiquidModal: vi.fn(),
    }
    
    vi.mocked(useSelector).mockImplementation(selector => selector(mockAppState));
    // vi.mocked(useSelector).mockReturnValue({
    //     labware: {
    //       mockLabwareId: {
    //         stack: ['mockLabwareId'],
    //         id: 'mockLabwareId',
    //         labwareDefURI: 'mockUri',
    //         def: fixture96Plate as LabwareDefinition2,
    //         pythonName: 'mockPythonName',
    //     },    
    //   },
    //   labwareId: 'mockLabwareId',
    //   selectedLabware: 'mockLabwareId',
    //   pipettes: {},
    //   modules: {},
    //   additionalEquipmentOnDeck: {},
    // })
    // vi.mocked(getInitialDeckSetup).mockReturnValue({
    //     labware: {
    //       mockLabwareId: {
    //         stack: ['mockLabwareId'],
    //         id: 'mockLabwareId',
    //         labwareDefURI: 'mockUri',
    //         def: fixture96Plate as LabwareDefinition2,
    //         pythonName: 'mockPythonName',
    //       },
    //     },
    //     pipettes: {},
    //     additionalEquipmentOnDeck: {},
    //     modules: {},
    //   })
  })

  it('should render text', () => {
    render(props)
    screen.getByText('mock AssignLiquidsModal')
  })
})
