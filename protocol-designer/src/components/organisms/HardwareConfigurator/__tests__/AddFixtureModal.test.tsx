import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { AddFixtureModal } from '../AddFixtureModal'

import type { ComponentProps } from 'react'
import type {
  AddressableAreaName,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { FormModules } from '/protocol-designer/step-forms'
import type { Fixtures } from '../../types'
import type { InitialDeckStateModules } from '../AddFixtureModal'

vi.mock('/protocol-designer/step-forms/actions')
vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/step-forms/selectors')
const render = (props: ComponentProps<typeof AddFixtureModal>) => {
  return renderWithProviders(<AddFixtureModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AddFixtureModal', () => {
  let props: ComponentProps<typeof AddFixtureModal>

  beforeEach(() => {
    props = {
      cutoutId: 'cutoutA1',
      closeModal: vi.fn(),
      modules: {},
      fixtures: {},
      deckConfig: [
        { cutoutId: 'cutoutA1', cutoutFixtureId: 'magneticBlockV1' },
      ],
      setValue: vi.fn(),
      hasGripper: true,
      addressableAreaId: 'A1',
    }
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      labware: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      pipettes: {},
    })
  })

  it('should render the fixture modal and clicking on the fixtures can select the trash bin', () => {
    render(props)
    screen.getByText('Add to Slot A1')
    screen.getByText('Fixtures')
    fireEvent.click(screen.getAllByText('Select options')[0])
    screen.getByText('Trash bin')
    fireEvent.click(screen.getByText('Add'))
    expect(props.setValue).toHaveBeenCalled()
    expect(vi.mocked(editDeckConfiguration)).toHaveBeenCalled()
  })
  it('should render the fixture modal and clicking on the modules can select the thermocycler', () => {
    render(props)
    screen.getByText('Add to Slot A1')
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[1])
    screen.getByText('Thermocycler Module GEN2')
    screen.getByText('Magnetic Block GEN1')
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Temperature Module GEN2')
    fireEvent.click(screen.getAllByText('Add')[1])
    expect(props.setValue).toHaveBeenCalled()
    expect(vi.mocked(editDeckConfiguration)).toHaveBeenCalled()
  })

  it('should use existing fixture in same cutout when adding a new fixture (one existing)', () => {
    const existingFixtures: Fixtures = {
      'existing-id': {
        cutoutId: 'cutoutD3' as CutoutId,
        name: 'stagingArea',
        cutoutFixtureId: 'stagingAreaRightSlot',
      },
    }
    const updatedDeckConfig: DeckConfiguration = [
      { cutoutId: 'cutoutA1', cutoutFixtureId: 'magneticBlockV1' },
      { cutoutId: 'cutoutD3', cutoutFixtureId: 'stagingAreaRightSlot' },
    ]
    const updatedProps = {
      ...props,
      cutoutId: 'cutoutD3' as CutoutId,
      addressableAreaId: 'D3' as const,
      deckConfig: updatedDeckConfig,
      fixtures: existingFixtures,
    }
    render(updatedProps)
    fireEvent.click(screen.getAllByText('Select options')[0])
    fireEvent.click(screen.getByText('Waste chute'))
    fireEvent.click(screen.getAllByText('Select options')[0])
    fireEvent.click(screen.getByText('Waste Chute'))
    fireEvent.click(screen.getAllByText('Add')[0])
    expect(props.setValue).toHaveBeenCalled()
    expect(props.setValue).toHaveBeenCalledWith('fixtures', expect.any(Object))
    const setValue = vi.mocked(props.setValue!)
    const fixturesCall = setValue.mock.calls.find(c => c[0] === 'fixtures')
    if (fixturesCall == null) throw new Error('expected fixtures call')
    const updatedFixtures = fixturesCall[1] as Fixtures
    const fixtureValues = Object.values(updatedFixtures)
    expect(fixtureValues).toEqual(
      expect.arrayContaining([
        {
          cutoutFixtureId: 'stagingAreaRightSlot',
          cutoutId: 'cutoutD3',
          name: 'stagingArea',
        },
        {
          cutoutFixtureId: 'wasteChuteRightAdapterNoCover',
          cutoutId: 'cutoutD3',
          name: 'wasteChute',
        },
      ])
    )
  })

  it('should handle two modules in same cutout when adding a new module (uses first match)', () => {
    const existingModules: InitialDeckStateModules = {
      magneticBlockV1: {
        id: 'magneticBlockV1',
        cutoutId: 'cutoutD3' as CutoutId,
        model: 'magneticBlockV1',
        type: 'magneticBlockType',
        slot: 'D3',
        moduleState: {} as any,
        pythonName: 'magneticBlockV1',
      },
    }
    const updatedDeckConfig: DeckConfiguration = [
      { cutoutId: 'cutoutD3', cutoutFixtureId: 'magneticBlockV1' },
    ]
    const updatedProps = {
      ...props,
      modules: existingModules,
      cutoutId: 'cutoutD3' as CutoutId,
      addressableAreaId: 'fakeD4' as AddressableAreaName,
      deckConfig: updatedDeckConfig,
    }
    render(updatedProps)
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[1])
    screen.getByText('Flex Stacker Module GEN1')
    fireEvent.click(screen.getAllByText('Add')[0])
    expect(props.setValue).toHaveBeenCalled()
    expect(props.setValue).toHaveBeenCalledWith('modules', expect.any(Object))
    const setValue = vi.mocked(props.setValue!)
    const modulesCall = setValue.mock.calls.find(c => c[0] === 'modules')
    if (modulesCall == null) throw new Error('expected modules call')
    const updatedModules = modulesCall[1] as FormModules
    const moduleValues = Object.values(updatedModules)
    // The existing module in cutoutD3 should be removed and replaced by the new module
    const modulesInD3 = moduleValues.filter(m => m.cutoutId === 'cutoutD3')
    expect(modulesInD3.length).toBeGreaterThanOrEqual(1)
    // The new module should be a flex stacker
    expect(modulesInD3).toEqual(
      expect.arrayContaining([
        {
          id: 'magneticBlockV1',
          cutoutId: 'cutoutD3',
          model: 'magneticBlockV1',
          slot: 'D3',
          type: 'magneticBlockType',
          moduleState: {} as any,
          pythonName: 'magneticBlockV1',
        },
        {
          cutoutFixtureId: 'flexStackerModuleV1',
          cutoutId: 'cutoutD3',
          model: 'flexStackerModuleV1',
          slot: 'D4',
          type: 'flexStackerModuleType',
        },
      ])
    )
  })

  it('does not offer modules on B3 when a vacuum module is on A3', () => {
    const updatedProps = {
      ...props,
      cutoutId: 'cutoutB3' as CutoutId,
      addressableAreaId: 'B3' as AddressableAreaName,
      modules: {
        vacuum: {
          id: 'vacuum',
          cutoutId: 'cutoutA3' as CutoutId,
          model: 'vacuumModuleV1' as const,
          type: 'vacuumModuleType' as const,
          slot: 'A3',
          moduleState: {} as any,
          pythonName: 'vacuumModule',
        },
      },
    }
    render(updatedProps)
    screen.getByText('Add to Slot B3')
    expect(screen.queryByText('Modules')).not.toBeInTheDocument()
  })

  it('does not offer the vacuum module on A3 when B3 already has a module', () => {
    const updatedProps = {
      ...props,
      cutoutId: 'cutoutA3' as CutoutId,
      addressableAreaId: 'A3' as AddressableAreaName,
      modules: {
        hs: {
          id: 'hs',
          cutoutId: 'cutoutB3' as CutoutId,
          model: 'heaterShakerModuleV1' as const,
          type: 'heaterShakerModuleType' as const,
          slot: 'B3',
          moduleState: {} as any,
          pythonName: 'heaterShaker',
        },
      },
    }
    render(updatedProps)
    screen.getByText('Modules')
    fireEvent.click(screen.getAllByText('Select options')[1])
    expect(screen.queryByText('Vacuum Module GEN1')).not.toBeInTheDocument()
    screen.getByText('Temperature Module GEN2')
  })
})
