// @flow

import React from 'react'
import { Formik } from 'formik'
import { shallow } from 'enzyme'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data'
import { Modal, InputField, OutlineButton } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { CrashInfoBox } from '../../../modules'
import { StepChangesConfirmModal } from '../../EditPipettesModal/StepChangesConfirmModal'
import { PipetteFields } from '../PipetteFields'
import { ModuleFields } from '../ModuleFields'
import { FilePipettesModal, type Props } from '../'

describe('FilePipettesModal', () => {
  const tiprackDefURI = 'tiprack_300'
  let props: Props, initialPipetteValues, initialModuleValues
  beforeEach(() => {
    initialPipetteValues = {
      left: {
        pipetteName: 'p300',
        tiprackDefURI,
      },
      right: {
        pipetteName: '',
        tiprackDefURI: null,
      },
    }

    initialModuleValues = {
      [MAGNETIC_MODULE_TYPE]: {
        onDeck: true,
        slot: '1',
        model: MAGNETIC_MODULE_V1,
      },
      [TEMPERATURE_MODULE_TYPE]: {
        onDeck: false,
        slot: '',
        model: null,
      },
      [THERMOCYCLER_MODULE_TYPE]: {
        onDeck: false,
        slot: '',
        model: null,
      },
    }

    props = {
      showProtocolFields: true,
      showModulesFields: true,
      hideModal: false,
      onCancel: jest.fn(),
      onSave: jest.fn(),
      moduleRestrictionsDisabled: false,
    }
  })

  function renderFormComponent(props) {
    return shallow(<FilePipettesModal {...props} />)
      .find(Formik)
      .dive()
  }

  it('does not display modal when hideModal prop', () => {
    props.hideModal = true

    const wrapper = shallow(<FilePipettesModal {...props} />)

    expect(wrapper.find(Modal)).toHaveLength(0)
  })

  describe('rendered fields', () => {
    it('renders InputField with name and default value', () => {
      const form = renderFormComponent(props)
      const protocolNameField = form.find(InputField)

      expect(protocolNameField.prop('name')).toEqual('fields.name')
      expect(protocolNameField.prop('value')).toEqual('')
    })

    it('renders PipetteFields with props', () => {
      const pipetteFields = renderFormComponent(props).find(PipetteFields)

      expect(pipetteFields.prop('values')).toEqual({
        left: { pipetteName: '', tiprackDefURI: null },
        right: { pipetteName: '', tiprackDefURI: null },
      })
      expect(pipetteFields.prop('errors')).toBeNull()
      expect(pipetteFields.prop('touched')).toBeNull()
    })

    it('renders ModuleFields', () => {
      const moduleFields = renderFormComponent(props).find(ModuleFields)

      expect(moduleFields).toHaveLength(1)
    })

    it('does not render ModuleFields when editing pipettes and showModulesFields is false', () => {
      props.showModulesFields = false

      const moduleFields = renderFormComponent(props).find(ModuleFields)

      expect(moduleFields).toHaveLength(0)
    })

    it('renders ModuleFields with props when modules are enabled', () => {
      const moduleFields = renderFormComponent(props).find(ModuleFields)

      expect(moduleFields).toHaveLength(1)
      expect(moduleFields.prop('errors')).toBeNull()
      expect(moduleFields.prop('touched')).toBeNull()
    })

    it('renders fields with values from props when exists', () => {
      props.initialPipetteValues = initialPipetteValues
      props.initialModuleValues = initialModuleValues

      const wrapper = renderFormComponent(props)
      const moduleFields = wrapper.find(ModuleFields)
      const pipetteFields = wrapper.find(PipetteFields)

      expect(moduleFields.prop('values')).toEqual(props.initialModuleValues)
      expect(pipetteFields.prop('values')).toEqual(props.initialPipetteValues)
    })
  })

  describe('form buttons', () => {
    it('does not allow save btn to be clicked when no pipette selected', () => {
      const saveButton = renderFormComponent(props)
        .find(OutlineButton)
        .filterWhere(n => n.render().text() === 'save')

      expect(saveButton.prop('disabled')).toBe(true)
    })

    it('is not disabled when pipette is selected', async () => {
      props.initialPipetteValues = initialPipetteValues
      props.initialModuleValues = initialModuleValues

      const wrapper = renderFormComponent(props)
      const saveButton = wrapper
        .find(OutlineButton)
        .filterWhere(n => n.render().text() === 'save')
      saveButton.simulate('click')
      // issue #823 in enzyme where simulate events are sync so we cannot test
      // the btn click -> component handleSubmit properly here since formik submit is async
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(saveButton.prop('disabled')).toBe(false)
      expect(props.onSave).toHaveBeenCalledWith({
        modules: [
          {
            type: MAGNETIC_MODULE_TYPE,
            model: MAGNETIC_MODULE_V1,
            slot: initialModuleValues[MAGNETIC_MODULE_TYPE].slot,
          },
        ],
        newProtocolFields: { name: '' },
        pipettes: [
          {
            mount: 'left',
            name: initialPipetteValues.left.pipetteName,
            tiprackDefURI: initialPipetteValues.left.tiprackDefURI,
          },
        ],
      })
    })

    it('closes the modal when clicking cancel button', () => {
      const cancel = renderFormComponent(props)
        .find(OutlineButton)
        .filterWhere(n => n.render().text() === 'cancel')
      cancel.simulate('click')

      expect(props.onCancel).toHaveBeenCalled()
    })
  })

  describe('step changes confirm modal', () => {
    it('displays edit confirmation when editing pipettes', () => {
      const wrapper = shallow(<FilePipettesModal {...props} />)
      wrapper.setState({
        showEditPipetteConfirmation: true,
      })

      expect(
        wrapper
          .find(Formik)
          .dive()
          .find(StepChangesConfirmModal)
      ).toHaveLength(1)
    })

    it('does not display edit confirmation when new protocol', () => {
      expect(
        renderFormComponent(props).find(StepChangesConfirmModal)
      ).toHaveLength(0)
    })
  })

  describe('render', () => {
    const crashableMagnet = {
      onDeck: true,
      slot: '1',
      model: MAGNETIC_MODULE_V1,
    }
    const nonCrashableMagnet = {
      onDeck: true,
      slot: '1',
      model: MAGNETIC_MODULE_V2,
    }
    const crashablePipette = {
      pipetteName: 'p300_multi',
      tiprackDefURI,
    }
    const noncrashablePipette = {
      pipetteName: 'p300',
      tiprackDefURI,
    }

    it('displays crash info box when crashable modules used with crashable pipettes', () => {
      initialModuleValues[MAGNETIC_MODULE_TYPE] = crashableMagnet
      props.initialModuleValues = initialModuleValues
      initialPipetteValues.left = crashablePipette
      props.initialPipetteValues = initialPipetteValues

      const wrapper = renderFormComponent(props)

      expect(wrapper.find(CrashInfoBox)).toHaveLength(1)
    })

    it('does not display crash info when noncrashable modules used with crashable pipettes', () => {
      initialPipetteValues.left = crashablePipette
      props.initialPipetteValues = initialPipetteValues
      initialModuleValues[MAGNETIC_MODULE_TYPE] = nonCrashableMagnet
      props.initialModuleValues = initialModuleValues

      const wrapper = renderFormComponent(props)

      expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
    })

    it('does not display crash info when noncrashable pipettes', () => {
      initialPipetteValues.left = noncrashablePipette
      initialModuleValues[MAGNETIC_MODULE_TYPE] = crashableMagnet

      props.initialPipetteValues = initialPipetteValues
      props.initialModuleValues = initialModuleValues

      const wrapper = renderFormComponent(props)

      expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
    })

    it('does not display crash info when module restrictions disabled', () => {
      initialPipetteValues.left = crashablePipette
      initialModuleValues[MAGNETIC_MODULE_TYPE] = crashableMagnet

      props.initialPipetteValues = initialPipetteValues
      props.initialModuleValues = initialModuleValues
      props.moduleRestrictionsDisabled = true

      const wrapper = renderFormComponent(props)

      expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
    })

    it('displays heading for new protocol when creating new protocol', () => {
      props.showProtocolFields = true

      const wrapper = shallow(<FilePipettesModal {...props} />)
        .find(Formik)
        .dive()
      const newProtocolHeader = wrapper
        .find('h2')
        .filterWhere(
          n =>
            n.render().text() ===
            i18n.t('modal.new_protocol.title.PROTOCOL_FILE')
        )

      expect(newProtocolHeader).toHaveLength(1)
    })

    it('displays edit pipettes title when editing pipettes', () => {
      props.showProtocolFields = false

      const wrapper = shallow(<FilePipettesModal {...props} />)
        .find(Formik)
        .dive()
      const editPipettesHeader = wrapper
        .find('h2')
        .filterWhere(
          n => n.render().text() === i18n.t('modal.edit_pipettes.title')
        )

      expect(editPipettesHeader).toHaveLength(1)
    })
  })
})
