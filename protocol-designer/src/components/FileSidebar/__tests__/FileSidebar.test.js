import React from 'react'
import { shallow } from 'enzyme'
import fileSaver from 'file-saver'
import { PrimaryButton, AlertModal, OutlineButton } from '@opentrons/components'
import { FileSidebar } from '../FileSidebar'
import { MAGDECK } from '../../../constants'

jest.mock('file-saver')

describe('FileSidebar', () => {
  let props
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
      pipetteEntities: {},
      moduleEntities: {},
      savedStepForms: {},
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
    props.downloadData.fileData.commands = [
      {
        command: 'pickUpTip',
        params: { pipette: 'p300', labware: 'well', well: 'A1' },
      },
    ]
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
    props.pipetteEntities = {
      pipetteLeftId: {
        name: 'pipette 300',
        id: 'pipetteLeftId',
        mount: 'left',
      },
      pipetteRightId: {
        name: 'pipette 50',
        id: 'pipetteRightId',
        mount: 'right',
      },
    }
    props.savedStepForms = {
      step123: {
        id: 'step123',
        pipette: 'p300',
      },
    }
    props.downloadData.fileData.commands = [
      {
        command: 'pickUpTip',
        params: { pipette: 'p300', labware: 'well', well: 'A1' },
      },
    ]

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused pipette')
  })

  test('warning modal is shown when export is clicked with unused module', () => {
    props.moduleEntities = {
      magnet123: {
        type: MAGDECK,
      },
    }
    props.savedStepForms = {
      step123: {
        id: 'step123',
        pipette: 'p300',
      },
    }
    props.downloadData.fileData.commands = [
      {
        command: 'pickUpTip',
        params: { pipette: 'p300', labware: 'well', well: 'A1' },
      },
    ]

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused module')
  })

  test('warning modal is shown when export is clicked with unused module and pipette', () => {
    props.moduleEntities = {
      magnet123: {
        type: MAGDECK,
      },
    }
    props.pipetteEntities = {
      pipetteLeftId: {
        name: 'pipette 300',
        id: 'pipetteLeftId',
        mount: 'left',
      },
      pipetteRightId: {
        name: 'pipette 50',
        id: 'pipetteRightId',
        mount: 'right',
      },
    }
    props.savedStepForms = {
      step123: {
        id: 'step123',
        pipette: 'p300',
      },
    }
    props.downloadData.fileData.commands = [
      {
        command: 'pickUpTip',
        params: { pipette: 'p300', labware: 'well', well: 'A1' },
      },
    ]

    const wrapper = shallow(<FileSidebar {...props} />)
    const downloadButton = wrapper.find(PrimaryButton).at(0)
    downloadButton.simulate('click')
    const alertModal = wrapper.find(AlertModal)

    expect(alertModal).toHaveLength(1)
    expect(alertModal.prop('heading')).toEqual('Unused pipette and module')
  })
})
