import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { createFile, getRobotType } from '../../../file-data/selectors'
import {
  getCurrentPage,
  getNewProtocolModal,
} from '../../../navigation/selectors'
import { i18n } from '../../../localization'
import {
  getAdditionalEquipment,
  getInitialDeckSetup,
  getSavedStepForms,
} from '../../../step-forms/selectors'
import { toggleNewProtocolModal } from '../../../navigation/actions'
import { getHasUnsavedChanges } from '../../../load-file/selectors'
import { useBlockingHint } from '../../Hints/useBlockingHint'
import {
  getUnusedEntities,
  getUnusedStagingAreas,
  getUnusedTrash,
} from '../utils'
import { FileSidebar } from '../FileSidebar'

jest.mock('../../../step-forms/selectors')
jest.mock('../../../load-file/selectors')
jest.mock('../../../navigation/actions')
jest.mock('../../../navigation/selectors')
jest.mock('../../../file-data/selectors')
jest.mock('../../Hints/useBlockingHint')
jest.mock('../utils')

const mockCreateFile = createFile as jest.MockedFunction<typeof createFile>
const mockGetCurrentPage = getCurrentPage as jest.MockedFunction<
  typeof getCurrentPage
>
const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>
const mockGetRobotType = getRobotType as jest.MockedFunction<
  typeof getRobotType
>
const mockGetAdditionalEquipment = getAdditionalEquipment as jest.MockedFunction<
  typeof getAdditionalEquipment
>
const mockGetSavedStepForms = getSavedStepForms as jest.MockedFunction<
  typeof getSavedStepForms
>
const mockGetNewProtocolModal = getNewProtocolModal as jest.MockedFunction<
  typeof getNewProtocolModal
>
const mockGetHasUnsavedChanges = getHasUnsavedChanges as jest.MockedFunction<
  typeof getHasUnsavedChanges
>
const mockGetUnusedTrash = getUnusedTrash as jest.MockedFunction<
  typeof getUnusedTrash
>
const mockGetUnusedStagingAreas = getUnusedStagingAreas as jest.MockedFunction<
  typeof getUnusedStagingAreas
>
const mockGetUnusedEntities = getUnusedEntities as jest.MockedFunction<
  typeof getUnusedEntities
>
const mockUseBlockingHint = useBlockingHint as jest.MockedFunction<
  typeof useBlockingHint
>
const mockToggleNewProtocolModal = toggleNewProtocolModal as jest.MockedFunction<
  typeof toggleNewProtocolModal
>

const render = () => {
  return renderWithProviders(<FileSidebar />, { i18nInstance: i18n })[0]
}

describe('FileSidebar', () => {
  beforeEach(() => {
    mockGetUnusedEntities.mockReturnValue([])
    mockGetUnusedStagingAreas.mockReturnValue([])
    mockGetUnusedTrash.mockReturnValue({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
    mockGetInitialDeckSetup.mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    mockGetHasUnsavedChanges.mockReturnValue(false)
    mockGetNewProtocolModal.mockReturnValue(false)
    mockGetSavedStepForms.mockReturnValue({})
    mockGetAdditionalEquipment.mockReturnValue({})
    mockGetRobotType.mockReturnValue(FLEX_ROBOT_TYPE)
    mockGetCurrentPage.mockReturnValue('settings-app')
    mockUseBlockingHint.mockReturnValue(null)
    mockCreateFile.mockReturnValue({
      commands: [
        {
          commandType: 'moveToAddressableArea',
          params: {
            addressableAreaName: 'movableTrashA3',
            pipetteId: 'mockId',
            offset: { x: 0, y: 0, z: 0 },
          },
        },
      ],
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders the file sidebar and buttons work as expected with no warning upon export', () => {
    render()
    screen.getByText('Protocol File')
    fireEvent.click(screen.getByRole('button', { name: 'Create New' }))
    expect(mockToggleNewProtocolModal).toHaveBeenCalled()
    screen.getByText('Import')
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(mockUseBlockingHint).toHaveBeenCalled()
  })
  it('renders the no commands warning', () => {
    mockCreateFile.mockReturnValue({
      commands: [],
    } as any)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Your protocol has no steps')
  })
  it('renders the unused pipette and module warning', () => {
    mockGetUnusedEntities.mockReturnValue([
      {
        mount: 'left',
        name: 'p1000_96',
        id: 'pipetteId',
        tiprackDefURI: 'mockURI',
        spec: {
          name: 'mock pip name',
          displayName: 'mock display name',
        },
      },
    ])
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused pipette and module')
  })
  it('renders the unused trash warning', () => {
    mockGetUnusedTrash.mockReturnValue({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused trash')
  })
  it('renders the unused waste chute warning', () => {
    mockGetUnusedTrash.mockReturnValue({
      trashBinUnused: false,
      wasteChuteUnused: true,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused trash')
  })
  it('renders the unused staging area slot warning', () => {
    mockGetUnusedStagingAreas.mockReturnValue(['D4'])
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('One or more staging area slots are unused')
  })
  it('renders the unused gripper warning', () => {
    mockGetAdditionalEquipment.mockReturnValue({
      gripperId: { name: 'gripper', id: 'gripperId' },
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused gripper')
  })
})
