import * as React from 'react'
import { shallow, mount } from 'enzyme'
import {
  DeprecatedPrimaryButton,
  AlertModal,
  OutlineButton,
} from '@opentrons/components'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import {
  LabwareDefinition2,
  MAGNETIC_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import { useBlockingHint } from '../../Hints/useBlockingHint'
import { FileSidebar, v8WarningContent } from '../FileSidebar'
import { FLEX_TRASH_DEF_URI } from '@opentrons/step-generation'

jest.mock('../../Hints/useBlockingHint')
jest.mock('../../../file-data/selectors')
jest.mock('../../../step-forms/selectors')

const mockUseBlockingHint = useBlockingHint as jest.MockedFunction<
  typeof useBlockingHint
>

describe('FileSidebar', () => {
  const pipetteLeftId = 'pipetteLeftId'
  const pipetteRightId = 'pipetteRightId'
  let props: React.ComponentProps<typeof FileSidebar>
  let commands: Command[]
  let modulesOnDeck: React.ComponentProps<typeof FileSidebar>['modulesOnDeck']
  let pipettesOnDeck: React.ComponentProps<typeof FileSidebar>['pipettesOnDeck']
  let savedStepForms: React.ComponentProps<typeof FileSidebar>['savedStepForms']
  beforeEach(() => {
    props = {
      loadFile: jest.fn(),
      createNewFile: jest.fn(),
      canDownload: true,
      onDownload: jest.fn(),
      fileData: {
        labware: {},
        labwareDefinitions: {},
        metadata: {},
        pipettes: {},
        robot: { model: 'OT-2 Standard', deckId: 'ot2_standard' },
        schemaVersion: 6,
        commands: [],
      } as any,
      pipettesOnDeck: {},
      modulesOnDeck: {},
      savedStepForms: {},
      robotType: 'OT-2 Standard',
      additionalEquipment: {},
      labwareOnDeck: {},
    }

    commands = [
      {
        command: 'pickUpTip',
        params: { pipette: pipetteLeftId, labware: 'well', well: 'A1' },
      },
    ]

    pipettesOnDeck = {
      pipetteLeftId: {
        name: 'string' as any,
        id: pipetteLeftId,
        tiprackDefURI: 'test',
        tiprackLabwareDef: fixture_tiprack_10_ul as LabwareDefinition2,
        spec: fixtureP10Single,
        mount: 'left',
      },
      pipetteRightId: {
        name: 'string' as any,
        id: pipetteRightId,
        tiprackDefURI: 'test',
        tiprackLabwareDef: fixture_tiprack_10_ul as LabwareDefinition2,
        spec: fixtureP300Single,
        mount: 'right',
      },
    }

    modulesOnDeck = {
      magnet123: {
        type: MAGNETIC_MODULE_TYPE,
      } as any,
    }

    savedStepForms = {
      step123: {
        id: 'step123',
        pipette: pipetteLeftId,
      } as any,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('create new button creates new protocol', () => {
    const wrapper = shallow(<FileSidebar {...props} />)
    const createButton = wrapper.find(OutlineButton).at(0)
    createButton.simulate('click')

    expect(props.createNewFile).toHaveBeenCalled()
  })

  it('import button imports saved protocol', () => {
    const event = { files: ['test.json'] }

    const wrapper = shallow(<FileSidebar {...props} />)
    const importButton = wrapper.find('[type="file"]')
    importButton.simulate('change', event)

    expect(props.loadFile).toHaveBeenCalledWith(event)
  })

  it('export button is disabled when canDownload is false', () => {
    props.canDownload = false

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)

    expect(downloadButton.prop('disabled')).toEqual(true)
  })

  it('warning modal is shown when export is clicked with no command', () => {
    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Your protocol has no steps')
  })

  it('warning modal is shown when export is clicked with unused pipette', () => {
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.pipettesOnDeck = pipettesOnDeck
    props.savedStepForms = savedStepForms

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused pipette')
    expect(alertModal.html()).toContain(
      pipettesOnDeck.pipetteRightId.spec.displayName
    )
    expect(alertModal.html()).toContain(pipettesOnDeck.pipetteRightId.mount)
    expect(alertModal.html()).not.toContain(
      pipettesOnDeck.pipetteLeftId.spec.displayName
    )
  })

  it('warning modal is shown when export is clicked with unused staging area slot', () => {
    const stagingArea = 'stagingAreaId'
    props.savedStepForms = savedStepForms
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.additionalEquipment = {
      [stagingArea]: {
        name: 'stagingArea',
        id: stagingArea,
        location: 'cutoutA3',
      },
    }

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual(
      'One or more staging area slots are unused'
    )
  })

  it('warning modal is shown when export is clicked with unused trash', () => {
    props.savedStepForms = savedStepForms
    const labwareId = 'mockLabwareId'
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.labwareOnDeck = {
      [labwareId]: { labwareDefURI: FLEX_TRASH_DEF_URI, id: labwareId } as any,
    }

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused trash')
  })

  it('warning modal is shown when export is clicked with unused gripper', () => {
    const gripperId = 'gripperId'
    props.modulesOnDeck = modulesOnDeck
    props.savedStepForms = savedStepForms
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.additionalEquipment = {
      [gripperId]: { name: 'gripper', id: gripperId },
    }

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused gripper')
  })

  it('warning modal is shown when export is clicked with unused module', () => {
    props.modulesOnDeck = modulesOnDeck
    props.savedStepForms = savedStepForms
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused module')
    expect(alertModal.html()).toContain('Magnetic module')
  })

  it('warning modal is shown when export is clicked with unused module and pipette', () => {
    props.modulesOnDeck = modulesOnDeck
    props.pipettesOnDeck = pipettesOnDeck
    props.savedStepForms = savedStepForms
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused pipette and module')
    expect(alertModal.html()).toContain(
      pipettesOnDeck.pipetteRightId.spec.displayName
    )
    expect(alertModal.html()).toContain(pipettesOnDeck.pipetteRightId.mount)
    expect(alertModal.html()).toContain('Magnetic module')
    expect(alertModal.html()).not.toContain(
      pipettesOnDeck.pipetteLeftId.spec.displayName
    )
  })

  it('blocking hint is shown', () => {
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.savedStepForms = savedStepForms

    const MockHintComponent = () => {
      return <div></div>
    }

    mockUseBlockingHint.mockReturnValue(<MockHintComponent />)

    const wrapper = mount(<FileSidebar {...props} />)

    expect(wrapper.exists(MockHintComponent)).toEqual(true)
    // Before save button is clicked, enabled should be false
    expect(mockUseBlockingHint).toHaveBeenNthCalledWith(1, {
      enabled: false,
      hintKey: 'export_v8_protocol_7_1',
      content: v8WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })

    const downloadButton = wrapper.find(DeprecatedPrimaryButton).at(0)
    downloadButton.simulate('click')

    // After save button is clicked, enabled should be true
    expect(mockUseBlockingHint).toHaveBeenLastCalledWith({
      enabled: true,
      hintKey: 'export_v8_protocol_7_1',
      content: v8WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })
  })
})
