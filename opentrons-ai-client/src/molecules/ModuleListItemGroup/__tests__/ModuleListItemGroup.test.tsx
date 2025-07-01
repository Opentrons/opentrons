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
    expect(screen.getAllByText('remove').length).toBe(2)

    screen.getByAltText('heaterShakerModuleType')
    screen.getByText('Heater-Shaker Module GEN1')

    screen.getByAltText('temperatureModuleType')
    screen.getByText('Temperature Module GEN2')
  })

  it('should remove the list item if remove is clicked', async () => {
    render()

    const removeListItemButton = screen.getAllByText('remove')[0]

    fireEvent.click(removeListItemButton)

    expect(
      screen.queryByText('Heater-Shaker Module GEN1')
    ).not.toBeInTheDocument()
  })

  it('should render the dropdown if adapters are available', () => {
    render()

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
})
