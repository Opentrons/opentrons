import React from 'react'
import { shallow } from 'enzyme'
import fileSaver from 'file-saver'
import { PrimaryButton, AlertModal, OutlineButton } from '@opentrons/components'
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import { FileSidebar } from '../FileSidebar'
import { MAGDECK } from '../../../constants'

jest.mock('file-saver')

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
          commands: [],
        },
        fileName: 'protocol.json',
        pipettes: {},
        modules: {},
      },
      pipettesOnDeck: {},
      modulesOnDeck: {},
      savedStepForms: {},
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
        type: MAGDECK,
      },
    }

    savedStepForms = {
      step123: {
        id: 'step123',
        pipette: pipetteLeftId,
      },
    }
  })

  test('create new button creates new protocol', () => {
    const wrapper = shallow(<FileSidebar {...props} />)
    const createButton = wrapper.find(OutlineButton).at(0)
    createButton.simulate('click')

    expect(props.createNewFile).toHaveBeenCalled()
  })

  test('import button imports saved protocol', () => {
    const event = { files: ['test.json'] }

    const wrapper = shallow(<FileSidebar {...props} />)
    const importButton = wrapper.find('[type="file"]')
    importButton.simulate('change', event)

    expect(props.loadFile).toHaveBeenCalledWith(event)
  })

  test('export button is disabled when canDownload is false', () => {
    props.canDownload = false

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)

    expect(downloadButton.prop('disabled')).toEqual(true)
  })

  test('export button exports protocol when no errors', () => {
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

  test('warning modal is shown when export is clicked with no command', () => {
    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Your protocol has no steps')
  })

  test('warning modal is shown when export is clicked with unused pipette', () => {
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

  test('warning modal is shown when export is clicked with unused module', () => {
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

  test('warning modal is shown when export is clicked with unused module and pipette', () => {
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
})
