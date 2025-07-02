import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { ModuleListItemGroup } from '../index'

// Define a local type matching the usage in the mock
interface TestDisplayModule {
  id: string
  type: string // Using string for simplicity in test mock
  model: string
  name: string
}

const modulesMock: TestDisplayModule[] = [
  {
    id: 'module-1',
    type: 'heaterShakerModuleType',
    model: 'heaterShakerModuleV1',
    name: 'Heater-Shaker Module GEN1',
  },
  {
    id: 'module-2',
    type: 'temperatureModuleType',
    model: 'temperatureModuleV2',
    name: 'Temperature Module GEN2',
  },
  {
    id: 'module-3',
    type: 'thermocyclerModuleType',
    model: 'thermocyclerModuleV2',
    name: 'Thermocycler Module GEN2',
  },
  {
    id: 'module-4',
    type: 'magneticModuleType',
    model: 'magneticModuleV2',
    name: 'Magnetic Module GEN2',
  },
  {
    id: 'module-5',
    type: 'magneticBlockType',
    model: 'magneticBlockV1',
    name: 'Magnetic Block GEN1',
  },
  {
    id: 'module-6',
    type: 'absorbanceReaderType',
    model: 'absorbanceReaderV1',
    name: 'Absorbance Plate Reader Module',
  },
]

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {
      modules: modulesMock,
    },
  })

  return (
    <FormProvider {...methods}>
      <ModuleListItemGroup />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ModuleListItemGroup', () => {
  it('should render ModuleListItemGroup component', () => {
    render()

    expect(screen.getAllByText('Adapter').length).toBe(2)
    expect(screen.getAllByText('remove').length).toBe(6)

    screen.getByAltText('heaterShakerModuleType')
    screen.getByText('Heater-Shaker Module GEN1')

    screen.getByAltText('temperatureModuleType')
    screen.getByText('Temperature Module GEN2')

    screen.getByAltText('thermocyclerModuleType')
    screen.getByText('Thermocycler Module GEN2')

    screen.getByAltText('magneticModuleType')
    screen.getByText('Magnetic Module GEN2')

    screen.getByAltText('magneticBlockType')
    screen.getByText('Magnetic Block GEN1')

    screen.getByAltText('absorbanceReaderType')
    screen.getByText('Absorbance Plate Reader Module')
  })

  it('should remove the list item if remove is clicked', async () => {
    render()

    const removeListItemButton = screen.getAllByText('remove')[0]

    fireEvent.click(removeListItemButton)

    expect(
      screen.queryByText('Heater-Shaker Module GEN1')
    ).not.toBeInTheDocument()
  })

  it('should render the dropdown only for modules with adapters enabled', () => {
    render()

    // Only Temperature Module and Heater-Shaker Module should have dropdowns
    expect(screen.getAllByText('Choose an adapter').length).toBe(2)
  })

  it('should be able to select an adapter', async () => {
    render()

    const dropdownButtons = screen.getAllByText('Choose an adapter')
    const secondModuleDropdownButton = dropdownButtons[1]

    fireEvent.click(secondModuleDropdownButton)

    const listBox = await screen.findByRole('listbox')

    const adapterOptionButton = within(listBox).getByText(
      'Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap'
    )

    fireEvent.click(adapterOptionButton)

    const listItems = screen.getAllByTestId('ListItem_default')
    const secondModuleListItem = listItems.find(item =>
      within(item).queryByText('Temperature Module GEN2')
    )

    if (secondModuleListItem == null) {
      throw new Error(
        'Test failed: Could not find the second module list item.'
      )
    }

    expect(
      within(secondModuleListItem).getByText(
        'Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap'
      )
    ).toBeInTheDocument()

    expect(
      within(secondModuleListItem).queryByText('Choose an adapter')
    ).not.toBeInTheDocument()
  })

  it('should not render dropdown for thermocycler, magnetic module, magnetic block, and absorbance reader', () => {
    render()

    const listItems = screen.getAllByTestId('ListItem_default')

    // Test Thermocycler Module
    const thermocyclerListItem = listItems.find(item =>
      within(item).queryByText('Thermocycler Module GEN2')
    )
    if (thermocyclerListItem == null) {
      throw new Error(
        'Test failed: Could not find the thermocycler module list item.'
      )
    }
    expect(
      within(thermocyclerListItem).queryByText('Adapter')
    ).not.toBeInTheDocument()
    expect(
      within(thermocyclerListItem).queryByText('Choose an adapter')
    ).not.toBeInTheDocument()
    expect(within(thermocyclerListItem).getByText('remove')).toBeInTheDocument()

    // Test Magnetic Module
    const magneticListItem = listItems.find(item =>
      within(item).queryByText('Magnetic Module GEN2')
    )
    if (magneticListItem == null) {
      throw new Error(
        'Test failed: Could not find the magnetic module list item.'
      )
    }
    expect(
      within(magneticListItem).queryByText('Adapter')
    ).not.toBeInTheDocument()
    expect(
      within(magneticListItem).queryByText('Choose an adapter')
    ).not.toBeInTheDocument()
    expect(within(magneticListItem).getByText('remove')).toBeInTheDocument()

    // Test Magnetic Block
    const magneticBlockListItem = listItems.find(item =>
      within(item).queryByText('Magnetic Block GEN1')
    )
    if (magneticBlockListItem == null) {
      throw new Error(
        'Test failed: Could not find the magnetic block list item.'
      )
    }
    expect(
      within(magneticBlockListItem).queryByText('Adapter')
    ).not.toBeInTheDocument()
    expect(
      within(magneticBlockListItem).queryByText('Choose an adapter')
    ).not.toBeInTheDocument()
    expect(
      within(magneticBlockListItem).getByText('remove')
    ).toBeInTheDocument()

    // Test Absorbance Reader
    const absorbanceReaderListItem = listItems.find(item =>
      within(item).queryByText('Absorbance Plate Reader Module')
    )
    if (absorbanceReaderListItem == null) {
      throw new Error(
        'Test failed: Could not find the absorbance reader list item.'
      )
    }
    expect(
      within(absorbanceReaderListItem).queryByText('Adapter')
    ).not.toBeInTheDocument()
    expect(
      within(absorbanceReaderListItem).queryByText('Choose an adapter')
    ).not.toBeInTheDocument()
    expect(
      within(absorbanceReaderListItem).getByText('remove')
    ).toBeInTheDocument()
  })
})
