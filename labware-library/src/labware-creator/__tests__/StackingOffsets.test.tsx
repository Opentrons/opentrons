import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { useFormikContext } from 'formik'
import { fireEvent, screen, render } from '@testing-library/react'
import {
  getAllDefinitions,
  fixtureTiprackAdapter,
  fixture96Plate,
} from '@opentrons/shared-data'
import { StackingOffsets } from '../components/sections/StackingOffsets'
import type * as Formik from 'formik'
import type * as SharedData from '@opentrons/shared-data'

vi.mock('formik', async importOriginal => {
  const actual = await importOriginal<typeof Formik>()
  return {
    ...actual,
    useFormikContext: vi.fn(),
  }
})

vi.mock('@opentrons/shared-data', async importOriginal => {
  const actual = await importOriginal<typeof SharedData>()
  return {
    ...actual,
    getAllDefinitions: vi.fn(),
  }
})
describe('StackingOffsets', () => {
  beforeEach(() => {
    vi.mocked(getAllDefinitions).mockReturnValue({
      adapter1: {
        ...fixtureTiprackAdapter,
        parameters: {
          ...fixtureTiprackAdapter.parameters,
          loadName: 'opentrons_flex_96_tiprack_adapter',
        },
        metadata: {
          ...fixtureTiprackAdapter.metadata,
          displayName: 'Opentrons Flex 96 Tip Rack Adapter',
        },
      } as SharedData.LabwareDefinition2,
      adapter2: fixture96Plate as SharedData.LabwareDefinition2,
    })
    vi.mocked(useFormikContext).mockReturnValue({
      values: {
        labwareType: 'tipRack',
        wellBottomShape: 'u',
        wellShape: 'circular',
        labwareXDimension: '10',
        gridColumns: '12',
        gridRows: '8',
        compatibleAdapters: {},
        compatibleModules: {},
      },
      touched: {
        labwareType: true,
        wellBottomShape: true,
        wellShape: true,
        labwareXDimension: true,
        gridColumns: true,
        gridRows: true,
        compatibleAdapters: {},
        compatibleModules: {},
      },
      errors: {},
    } as any)
  })

  it('renders main text and no modules if is tiprack is true', () => {
    render(<StackingOffsets />)
    screen.getByText(
      'Stacking offset is only required for labware that can be placed on an adapter or module. Select the compatible adapters or modules below.'
    )
    screen.getByText(
      'Stack the labware onto the adapter or module and then make the required measurement with calipers.'
    )
    screen.getByText('Stacking Offset (Optional)')
    screen.getByAltText('Stacking offset image')
  })

  it('renders the adapters section if is tiprack is true', () => {
    const mockFieldValue = vi.fn()
    vi.mocked(useFormikContext).mockReturnValue({
      values: {
        labwareType: 'tipRack',
        wellBottomShape: 'u',
        wellShape: 'circular',
        labwareXDimension: '10',
        gridColumns: '12',
        gridRows: '8',
        compatibleAdapters: {},
        compatibleModules: {},
      },
      touched: {
        labwareType: true,
        wellBottomShape: true,
        wellShape: true,
        labwareXDimension: true,
        gridColumns: true,
        gridRows: true,
        compatibleAdapters: {},
        compatibleModules: {},
      },
      errors: {},
      setFieldValue: mockFieldValue,
    } as any)
    render(<StackingOffsets />)

    screen.getByText('Adapters')
    screen.getByText('Opentrons Flex 96 Tip Rack Adapter')
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(mockFieldValue).toHaveBeenCalledWith('compatibleAdapters', {
      opentrons_flex_96_tiprack_adapter: 0,
    })
  })

  it('renders the modules section and clicking on one reveals the text field', () => {
    const mockFieldValue = vi.fn()
    vi.mocked(useFormikContext).mockReturnValue({
      values: {
        labwareType: 'wellPlate',
        wellBottomShape: 'v',
        wellShape: 'circular',
        labwareXDimension: '10',
        gridColumns: '12',
        gridRows: '8',
        compatibleAdapters: {},
        compatibleModules: {},
      },
      touched: {
        labwareType: true,
        wellBottomShape: true,
        wellShape: true,
        labwareXDimension: true,
        gridColumns: true,
        gridRows: true,
        compatibleAdapters: {},
        compatibleModules: {},
      },
      errors: {},
      setFieldValue: mockFieldValue,
    } as any)
    render(<StackingOffsets />)
    screen.getByText('Modules')
    screen.getByText('Magnetic Block GEN1')
    screen.getByText('Thermocycler Module GEN2')
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(mockFieldValue).toHaveBeenCalledWith('compatibleModules', {
      magneticBlockV1: 0,
    })
  })
  it('renders the stacking offset alert', () => {
    vi.mocked(useFormikContext).mockReturnValue({
      values: {
        labwareType: 'wellPlate',
        wellBottomShape: 'v',
        wellShape: 'circular',
        labwareXDimension: '10',
        gridColumns: '12',
        gridRows: '8',
        compatibleAdapters: { adapter: 10 },
        compatibleModules: {},
      },
      touched: {
        labwareType: true,
        wellBottomShape: true,
        wellShape: true,
        labwareXDimension: true,
        gridColumns: true,
        gridRows: true,
        compatibleAdapters: {},
        compatibleModules: {},
      },
      errors: {},
      setFieldValue: vi.fn(),
    } as any)
    render(<StackingOffsets />)
    screen.getByText(
      'The stacking offset fields require App version 7.0.0 or higher'
    )
  })
})
