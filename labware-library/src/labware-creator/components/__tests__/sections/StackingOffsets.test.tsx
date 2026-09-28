import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { useFormikContext } from 'formik'

import {
  fixture96Plate,
  fixtureTiprackAdapter,
  getAllDefinitions,
} from '@opentrons/shared-data'

import { StackingOffsets } from '../../sections/StackingOffsets'

import type * as SharedData from '@opentrons/shared-data'

vi.mock('formik')

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
        stackedLabwareZDimension: undefined,
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
        stackedLabwareZDimension: true,
        compatibleAdapters: {},
        compatibleModules: {},
      },
      errors: {},
    } as any)
  })
  it('renders main text and no modules if is tiprack is true', () => {
    render(<StackingOffsets />)
    screen.getByText(
      'Stacking offset is only required for labware that can be placed on an adapter, module, or itself.'
    )
    screen.getByText(
      'Stack the labware onto the adapter, module, or itself and then make the required measurement with calipers.'
    )
    screen.getByText('Stacking Offset (Optional)')
    screen.getByAltText('Stacking offset image')
    screen.getByAltText('Labware stacking offset image')
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
        stackedLabwareZDimension: undefined,
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
        stackedLabwareZDimension: true,
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

  it('renders vacuum adapters and hides modules for filter plates', () => {
    const mockFieldValue = vi.fn()
    vi.mocked(getAllDefinitions).mockReturnValue({
      collarShort: {
        ...fixtureTiprackAdapter,
        parameters: {
          ...fixtureTiprackAdapter.parameters,
          loadName: 'opentrons_vacuum_manifold_collar_short',
          quirks: ['vacuumModuleDock'],
        },
        metadata: {
          ...fixtureTiprackAdapter.metadata,
          displayName: 'Opentrons Vacuum Manifold Collar Short',
        },
        dimensions: {
          ...fixtureTiprackAdapter.dimensions,
          zDimension: 42.48,
        },
        stackingOffsetWithLabware: {
          default: { x: 0, y: 0, z: 3.5 },
        },
        allowedRoles: ['adapter'],
      } as SharedData.LabwareDefinition2,
      collarTall: {
        ...fixtureTiprackAdapter,
        parameters: {
          ...fixtureTiprackAdapter.parameters,
          loadName: 'opentrons_vacuum_manifold_collar_tall',
          quirks: ['vacuumModuleDock'],
        },
        metadata: {
          ...fixtureTiprackAdapter.metadata,
          displayName: 'Opentrons Vacuum Manifold Collar Tall',
        },
        dimensions: {
          ...fixtureTiprackAdapter.dimensions,
          zDimension: 71.68,
        },
        stackingOffsetWithLabware: {
          default: { x: 0, y: 0, z: 3.5 },
        },
        allowedRoles: ['adapter'],
      } as SharedData.LabwareDefinition2,
    })
    vi.mocked(useFormikContext).mockReturnValue({
      values: {
        labwareType: 'filterPlate',
        wellBottomShape: 'v',
        wellShape: 'circular',
        labwareZDimension: '14',
        gridColumns: '12',
        gridRows: '8',
        compatibleAdapters: {},
        compatibleModules: {},
      },
      touched: {},
      errors: {},
      setFieldValue: mockFieldValue,
    } as any)

    render(<StackingOffsets />)

    screen.getByText('Opentrons Vacuum Manifold Collar Short')
    screen.getByText('Opentrons Vacuum Manifold Collar Tall')
    expect(screen.queryByText('Magnetic Block GEN1')).toBeNull()
    expect(screen.queryByText('Thermocycler Module GEN2')).toBeNull()
    expect(mockFieldValue).toHaveBeenCalledWith('compatibleAdapters', {
      opentrons_vacuum_manifold_collar_short: 0,
      opentrons_vacuum_manifold_collar_tall: 0,
    })
  })

  it('autofills both collars from collar height + skirt height on filter plates', () => {
    const mockFieldValue = vi.fn()
    vi.mocked(getAllDefinitions).mockReturnValue({
      collarShort: {
        ...fixtureTiprackAdapter,
        parameters: {
          ...fixtureTiprackAdapter.parameters,
          loadName: 'opentrons_vacuum_manifold_collar_short',
          quirks: ['vacuumModuleDock'],
        },
        metadata: {
          ...fixtureTiprackAdapter.metadata,
          displayName: 'Opentrons Vacuum Manifold Collar Short',
        },
        dimensions: {
          ...fixtureTiprackAdapter.dimensions,
          zDimension: 42.48,
        },
        stackingOffsetWithLabware: {
          default: { x: 0, y: 0, z: 3.5 },
        },
        allowedRoles: ['adapter'],
      } as SharedData.LabwareDefinition2,
      collarTall: {
        ...fixtureTiprackAdapter,
        parameters: {
          ...fixtureTiprackAdapter.parameters,
          loadName: 'opentrons_vacuum_manifold_collar_tall',
          quirks: ['vacuumModuleDock'],
        },
        metadata: {
          ...fixtureTiprackAdapter.metadata,
          displayName: 'Opentrons Vacuum Manifold Collar Tall',
        },
        dimensions: {
          ...fixtureTiprackAdapter.dimensions,
          zDimension: 71.68,
        },
        stackingOffsetWithLabware: {
          default: { x: 0, y: 0, z: 3.5 },
        },
        allowedRoles: ['adapter'],
      } as SharedData.LabwareDefinition2,
      spacer: {
        ...fixtureTiprackAdapter,
        parameters: {
          ...fixtureTiprackAdapter.parameters,
          loadName: 'opentrons_vacuum_manifold_spacer_7.25mm',
          quirks: ['vacuumSpacer'],
        },
        metadata: {
          ...fixtureTiprackAdapter.metadata,
          displayName: 'Opentrons Vacuum Manifold Spacer 7.25 mm',
        },
        allowedRoles: ['adapter'],
      } as SharedData.LabwareDefinition2,
    })
    vi.mocked(useFormikContext).mockReturnValue({
      values: {
        labwareType: 'filterPlate',
        wellBottomShape: 'flat',
        wellShape: 'circular',
        labwareZDimension: '35',
        skirtHeight: '10',
        gridColumns: '12',
        gridRows: '8',
        compatibleAdapters: {},
        compatibleModules: {},
      },
      touched: {},
      errors: {},
      setFieldValue: mockFieldValue,
    } as any)

    render(<StackingOffsets />)

    expect(mockFieldValue).toHaveBeenCalledWith('compatibleAdapters', {
      opentrons_vacuum_manifold_collar_short: 48.98,
      opentrons_vacuum_manifold_collar_tall: 78.18,
    })

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Opentrons Vacuum Manifold Spacer 7.25 mm',
      })
    )
    expect(mockFieldValue).toHaveBeenLastCalledWith('compatibleAdapters', {
      'opentrons_vacuum_manifold_spacer_7.25mm': 0,
    })
  })
})
