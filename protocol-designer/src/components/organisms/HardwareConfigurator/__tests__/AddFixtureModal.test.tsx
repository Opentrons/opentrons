import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { AddFixtureModal } from '../AddFixtureModal'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/step-forms/actions')
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
      hasGripper: false,
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
    screen.getByText('Add to slot A1')
    screen.getByText('Fixtures')
    fireEvent.click(screen.getAllByText('Select options')[0])
    screen.getByText('Trash bin')
    fireEvent.click(screen.getByText('Add'))
    expect(props.setValue).toHaveBeenCalled()
    expect(vi.mocked(editDeckConfiguration)).toHaveBeenCalled()
  })
  it('should render the fixture modal and clicking on the modules can select the thermocycler', () => {
    render(props)
    screen.getByText('Add to slot A1')
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
})
