import * as React from 'react'
import { shallow, mount } from 'enzyme'
import { PrimaryButton, AlertModal, OutlineButton } from '@opentrons/components'
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
import { FileSidebar, v4WarningContent, v5WarningContent } from '../FileSidebar'
import { useBlockingHint } from '../../Hints/useBlockingHint'

jest.mock('../../Hints/useBlockingHint')

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
        robot: { model: 'OT-2 Standard' },
        schemaVersion: 3,
        commands: [],
      },
      pipettesOnDeck: {},
      modulesOnDeck: {},
      savedStepForms: {},
      schemaVersion: 3,
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
    const downloadButton = wrapper.find(PrimaryButton).at(0)

    expect(downloadButton.prop('disabled')).toEqual(true)
  })

  it('export button exports protocol when no errors', () => {
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')

    expect(props.onDownload).toHaveBeenCalled()
  })

  it('warning modal is shown when export is clicked with no command', () => {
    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Your protocol has no steps')

    const continueButton = alertModal.dive().find(OutlineButton).at(1)
    continueButton.simulate('click')
    expect(props.onDownload).toHaveBeenCalled()
  })

  it('warning modal is shown when export is clicked with unused pipette', () => {
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.pipettesOnDeck = pipettesOnDeck
    props.savedStepForms = savedStepForms

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
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

    const continueButton = alertModal.dive().find(OutlineButton).at(1)
    continueButton.simulate('click')
    expect(props.onDownload).toHaveBeenCalled()
  })

  it('warning modal is shown when export is clicked with unused module', () => {
    props.modulesOnDeck = modulesOnDeck
    props.savedStepForms = savedStepForms
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused module')
    expect(alertModal.html()).toContain('Magnetic module')

    const continueButton = alertModal.dive().find(OutlineButton).at(1)
    continueButton.simulate('click')
    expect(props.onDownload).toHaveBeenCalled()
  })

  it('warning modal is shown when export is clicked with unused module and pipette', () => {
    props.modulesOnDeck = modulesOnDeck
    props.pipettesOnDeck = pipettesOnDeck
    props.savedStepForms = savedStepForms
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
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

    const continueButton = alertModal.dive().find(OutlineButton).at(1)
    continueButton.simulate('click')
    expect(props.onDownload).toHaveBeenCalled()
  })

  it('blocking hint is shown when protocol is v4', () => {
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.pipettesOnDeck = {
      pipetteLeftId: {
        // @ts-expect-error(sa, 2021-6-22): not a valid pipette name
        name: 'string',
        id: pipetteLeftId,
        tiprackDefURI: 'test',
        tiprackLabwareDef: fixture_tiprack_10_ul as LabwareDefinition2,
        spec: fixtureP10Single,
        mount: 'left',
      },
    }
    props.savedStepForms = savedStepForms

    const MockHintComponent = () => {
      return <div></div>
    }

    mockUseBlockingHint.mockReturnValue(<MockHintComponent />)

    const wrapper = mount(<FileSidebar {...props} schemaVersion={4} />)

    expect(wrapper.exists(MockHintComponent)).toEqual(true)
    // Before save button is clicked, enabled should be false
    expect(mockUseBlockingHint).toHaveBeenNthCalledWith(1, {
      enabled: false,
      hintKey: 'export_v4_protocol_3_18',
      content: v4WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })

    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')

    // After save button is clicked, enabled should be true
    expect(mockUseBlockingHint).toHaveBeenLastCalledWith({
      enabled: true,
      hintKey: 'export_v4_protocol_3_18',
      content: v4WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })
  })

  it('blocking hint is shown when protocol is v5', () => {
    // @ts-expect-error(sa, 2021-6-22): props.fileData might be null
    props.fileData.commands = commands
    props.savedStepForms = savedStepForms

    const MockHintComponent = () => {
      return <div></div>
    }

    mockUseBlockingHint.mockReturnValue(<MockHintComponent />)

    const wrapper = mount(<FileSidebar {...props} schemaVersion={5} />)

    expect(wrapper.exists(MockHintComponent)).toEqual(true)
    // Before save button is clicked, enabled should be false
    expect(mockUseBlockingHint).toHaveBeenNthCalledWith(1, {
      enabled: false,
      hintKey: 'export_v5_protocol_3_20',
      content: v5WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })

    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')

    // After save button is clicked, enabled should be true
    expect(mockUseBlockingHint).toHaveBeenLastCalledWith({
      enabled: true,
      hintKey: 'export_v5_protocol_3_20',
      content: v5WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })
  })
})
