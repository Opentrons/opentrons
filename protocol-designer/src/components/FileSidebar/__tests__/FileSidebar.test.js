// @flow
import * as React from 'react'
import { shallow, mount } from 'enzyme'
import fileSaver from 'file-saver'
import { PrimaryButton, AlertModal, OutlineButton } from '@opentrons/components'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import { FileSidebar, v4WarningContent } from '../FileSidebar'
import { useBlockingHint } from '../../Hints/useBlockingHint'
import type { HintArgs } from '../../Hints/useBlockingHint'

jest.mock('file-saver')
jest.mock('../../Hints/useBlockingHint')

const mockUseBlockingHint: JestMockFn<[HintArgs], ?React.Node> = useBlockingHint

describe('FileSidebar', () => {
  const pipetteLeftId = 'pipetteLeftId'
  const pipetteRightId = 'pipetteRightId'
  let props, commands, modulesOnDeck, pipettesOnDeck, savedStepForms
  beforeEach(() => {
    fileSaver.saveAs = jest.fn()

    props = {
      loadFile: jest.fn(),
      createNewFile: jest.fn(),
      canDownload: true,
      onDownload: jest.fn(),
      downloadData: {
        fileData: {
          labware: {},
          labwareDefinitions: {},
          metadata: {},
          pipettes: {},
          robot: { model: 'OT-2 Standard' },
          schemaVersion: 3,
          commands: [],
        },
        fileName: 'protocol.json',
      },
      pipettesOnDeck: {},
      modulesOnDeck: {},
      savedStepForms: {},
      isV4Protocol: false,
    }

    commands = [
      {
        command: 'pickUpTip',
        params: { pipette: pipetteLeftId, labware: 'well', well: 'A1' },
      },
    ]

    pipettesOnDeck = {
      pipetteLeftId: {
        name: 'string',
        id: pipetteLeftId,
        tiprackDefURI: 'test',
        tiprackLabwareDef: fixture_tiprack_10_ul,
        spec: fixtureP10Single,
        mount: 'left',
      },
      pipetteRightId: {
        name: 'string',
        id: pipetteRightId,
        tiprackDefURI: 'test',
        tiprackLabwareDef: fixture_tiprack_10_ul,
        spec: fixtureP300Single,
        mount: 'right',
      },
    }

    modulesOnDeck = {
      magnet123: {
        type: MAGNETIC_MODULE_TYPE,
      },
    }

    savedStepForms = {
      step123: {
        id: 'step123',
        pipette: pipetteLeftId,
      },
    }
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
    props.downloadData.fileData.commands = commands
    const blob = new Blob([JSON.stringify(props.downloadData.fileData)], {
      type: 'application/json',
    })

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')

    expect(props.onDownload).toHaveBeenCalled()
    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, 'protocol.json')
  })

  it('warning modal is shown when export is clicked with no command', () => {
    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Your protocol has no steps')
  })

  it('warning modal is shown when export is clicked with unused pipette', () => {
    props.downloadData.fileData.commands = commands
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
  })

  it('warning modal is shown when export is clicked with unused module', () => {
    props.modulesOnDeck = modulesOnDeck
    props.savedStepForms = savedStepForms
    props.downloadData.fileData.commands = commands

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
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
    props.downloadData.fileData.commands = commands

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
  })

  it('blocking hint is shown when protocol contains modules', () => {
    props.downloadData.fileData.commands = commands
    props.pipettesOnDeck = {
      pipetteLeftId: {
        name: 'string',
        id: pipetteLeftId,
        tiprackDefURI: 'test',
        tiprackLabwareDef: fixture_tiprack_10_ul,
        spec: fixtureP10Single,
        mount: 'left',
      },
    }
    props.savedStepForms = savedStepForms

    const MockHintComponent = () => {
      return <div></div>
    }

    mockUseBlockingHint.mockReturnValue(<MockHintComponent />)

    const wrapper = mount(<FileSidebar {...props} isV4Protocol={true} />)

    expect(wrapper.exists(MockHintComponent)).toEqual(true)
    // Before save button is clicked, enabled should be false
    expect(mockUseBlockingHint).toHaveBeenNthCalledWith(1, {
      enabled: false,
      hintKey: 'export_v4_protocol',
      content: v4WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })

    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')

    // After save button is clicked, enabled should be true
    expect(mockUseBlockingHint).toHaveBeenLastCalledWith({
      enabled: true,
      hintKey: 'export_v4_protocol',
      content: v4WarningContent,
      handleCancel: expect.any(Function),
      handleContinue: expect.any(Function),
    })
  })
})
