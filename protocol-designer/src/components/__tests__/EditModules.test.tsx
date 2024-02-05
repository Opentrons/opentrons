import * as React from 'react'
import { screen } from '@testing-library/react'
import { vi, beforeEach, describe, it } from 'vitest'
import { i18n } from '../../localization'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { getDismissedHints } from '../../tutorial/selectors'
import { EditModules } from '../EditModules'
import { EditModulesModal } from '../modals/EditModulesModal'
import { renderWithProviders } from '../../__testing-utils__'

import type { HintKey } from '../../tutorial'

vi.mock('../../step-forms/selectors')
vi.mock('../modals/EditModulesModal')
vi.mock('../../tutorial/selectors')

const render = (props: React.ComponentProps<typeof EditModules>) => {
  return renderWithProviders(<EditModules {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockId = 'mockId'
const hintKey: HintKey = 'change_magnet_module_model'

describe('EditModules', () => {
  let props: React.ComponentProps<typeof EditModules>

  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      moduleToEdit: {
        moduleType: 'heaterShakerModuleType',
        moduleId: mockId,
      },
    }
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {
        [mockId]: {
          id: mockId,
          type: 'heaterShakerModuleType',
          model: 'heaterShakerModuleV1',
          slot: 'A1',
          moduleState: {} as any,
        },
      },
      pipettes: {},
      labware: {},
      additionalEquipmentOnDeck: {},
    })
    vi.mocked(EditModulesModal).mockReturnValue(<div>mock EditModulesModal</div>)
    vi.mocked(getDismissedHints).mockReturnValue([hintKey])
  })

  it('renders the edit modules modal', () => {
    render(props)
    screen.getByText('mock EditModulesModal')
  })
})
