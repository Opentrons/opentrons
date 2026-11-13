import { beforeEach, describe, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'

import { AlignToModuleChildSlot } from '@opentrons/components'
import {
  fixture24Tuberack,
  FLEX_STACKER_MODULE_V1,
  getModuleDef,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { LabwareOnDeck } from '/protocol-designer/components/organisms'

import { ModuleChildLabware } from '../ModuleChildLabware'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/components/organisms')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof AlignToModuleChildSlot>()
  return {
    ...actual,
    AlignToModuleChildSlot: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof ModuleChildLabware>) => {
  return renderWithProviders(<ModuleChildLabware {...props} />)[0]
}

describe('ModuleChildLabware', () => {
  let props: ComponentProps<typeof ModuleChildLabware>

  beforeEach(() => {
    props = {
      labwareOnDeck: {
        id: 'labwareId',
        def: fixture24Tuberack as LabwareDefinition2,
        labwareDefURI: 'fixture/fixture_24_tuberack/1',
        stack: ['labwareId', 'moduleId', 'D3'],
        pythonName: 'labware_1',
      },
      moduleDefinition: getModuleDef(FLEX_STACKER_MODULE_V1),
      deckId: 'ot3_standard',
      slotId: 'D3',
    }
    vi.mocked(AlignToModuleChildSlot).mockImplementation(({ children }) => (
      <div>mock AlignToModuleChildSlot{children}</div>
    ))
    vi.mocked(LabwareOnDeck).mockReturnValue(<div>mock LabwareOnDeck</div>)
  })

  it('renders labware aligned to the module child slot', () => {
    render(props)
    screen.getByText('mock AlignToModuleChildSlot')
    screen.getByText('mock LabwareOnDeck')
  })

  it('passes xOffset through to LabwareOnDeck', () => {
    vi.mocked(LabwareOnDeck).mockImplementation(({ x }) => (
      <div>{`mock LabwareOnDeck x=${x}`}</div>
    ))
    render({ ...props, xOffset: 17.5 })
    screen.getByText('mock LabwareOnDeck x=17.5')
  })
})
