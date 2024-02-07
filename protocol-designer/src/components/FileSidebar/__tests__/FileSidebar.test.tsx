import * as React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../__testing-utils__' 
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

vi.mock('../../../step-forms/selectors')
vi.mock('../../../load-file/selectors')
vi.mock('../../../navigation/actions')
vi.mock('../../../navigation/selectors')
vi.mock('../../../file-data/selectors')
vi.mock('../../Hints/useBlockingHint')
vi.mock('../utils')

const render = () => {
  return renderWithProviders(<FileSidebar />, { i18nInstance: i18n })[0]
}

describe('FileSidebar', () => {
  beforeEach(() => {
    vi.mocked(getUnusedEntities).mockReturnValue([])
    vi.mocked(getUnusedStagingAreas).mockReturnValue([])
    vi.mocked(getUnusedTrash).mockReturnValue({
      trashBinUnused: false,
      wasteChuteUnused: false,
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
    vi.mocked(getHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(getNewProtocolModal).mockReturnValue(false)
    vi.mocked(getSavedStepForms).mockReturnValue({})
    vi.mocked(getAdditionalEquipment).mockReturnValue({})
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(getCurrentPage).mockReturnValue('settings-app')
    vi.mocked(useBlockingHint).mockReturnValue(null)
    vi.mocked(createFile).mockReturnValue({
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
    vi.resetAllMocks()
    cleanup()
  })
  it('renders the file sidebar and buttons work as expected with no warning upon export', () => {
    render()
    screen.getByText('Protocol File')
    fireEvent.click(screen.getByRole('button', { name: 'Create New' }))
    expect(vi.mocked(toggleNewProtocolModal)).toHaveBeenCalled()
    screen.getByText('Import')
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(vi.mocked(useBlockingHint)).toHaveBeenCalled()
  })
  it('renders the no commands warning', () => {
    vi.mocked(createFile).mockReturnValue({
      commands: [],
    } as any)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Your protocol has no steps')
  })
  it('renders the unused pipette and module warning', () => {
    vi.mocked(getUnusedEntities).mockReturnValue([
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
    vi.mocked(getUnusedTrash).mockReturnValue({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused trash')
  })
  it('renders the unused waste chute warning', () => {
    vi.mocked(getUnusedTrash).mockReturnValue({
      trashBinUnused: false,
      wasteChuteUnused: true,
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused trash')
  })
  it('renders the unused staging area slot warning', () => {
    vi.mocked(getUnusedStagingAreas).mockReturnValue(['D4'])
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('One or more staging area slots are unused')
  })
  it('renders the unused gripper warning', () => {
    vi.mocked(getAdditionalEquipment).mockReturnValue({
      gripperId: { name: 'gripper', id: 'gripperId' },
    })
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    screen.getByText('Unused gripper')
  })
})
