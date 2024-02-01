import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../localization'
import { getDismissedHints } from '../../tutorial/selectors'
import { HintKey } from '../../tutorial'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { EditModules } from '../EditModules'
import { EditModulesModal } from '../modals/EditModulesModal'

jest.mock('../../step-forms/selectors')
jest.mock('../modals/EditModulesModal')
jest.mock('../../tutorial/selectors')

const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockEditModulesModal = EditModulesModal as jest.MockedFunction<
  typeof EditModulesModal
>
const mockGetDismissedHints = getDismissedHints as jest.MockedFunction<
  typeof getDismissedHints
>

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
      onCloseClick: jest.fn(),
      moduleToEdit: {
        moduleType: 'heaterShakerModuleType',
        moduleId: mockId,
      },
    }
    mockGetInitialDeckSetup.mockReturnValue({
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
    mockEditModulesModal.mockReturnValue(<div>mock EditModulesModal</div>)
    mockGetDismissedHints.mockReturnValue([hintKey])
  })

  it('renders the edit modules modal', () => {
    render(props)
    screen.getByText('mock EditModulesModal')
  })
})
