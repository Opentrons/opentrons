import * as React from 'react'
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
      adapter1: fixtureTiprackAdapter as SharedData.LabwareDefinition2,
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
      'Select which adapters or modules this labware will be placed on.'
    )
    screen.getByText(
      'Stacking offset is required for labware to be placed on modules and adapters. Measure from the bottom of the adapter to the highest part of the labware using a pair of calipers.'
    )
    screen.getByText('Stacking Offset (Optional)')
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
