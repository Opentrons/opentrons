// @flow
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
} from '../step-forms'
import { moveDeckItem } from '../labware-ingred/actions/actions'
import { useBlockingHint } from './Hints/useBlockingHint'
import { MagneticModuleWarningModalContent } from './modals/EditModulesModal/MagneticModuleWarningModalContent'
import { EditModulesModal } from './modals/EditModulesModal'
import type { ModuleModel, ModuleRealType } from '@opentrons/shared-data'

type EditModulesProps = {|
  moduleToEdit: {
    moduleId: ?string,
    moduleType: ModuleRealType,
  },
  onCloseClick: () => mixed,
|}

export type ModelModuleInfo = {|
  model: ModuleModel,
  slot: string,
|}

export const EditModules = (props: EditModulesProps) => {
  const { onCloseClick, moduleToEdit } = props
  const { moduleId, moduleType } = moduleToEdit
  const _initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)

  const moduleOnDeck = moduleId ? _initialDeckSetup.modules[moduleId] : null
  const [
    changeModuleWarningInfo,
    displayModuleWarning,
  ] = useState<null | ModelModuleInfo>(null)
  const dispatch = useDispatch()

  const editModuleModel = (selectedModel: ModuleModel) => {
    if (moduleOnDeck?.id != null) {
      dispatch(
        stepFormActions.editModule({
          id: moduleOnDeck.id,
          model: selectedModel,
        })
      )
    } else {
      console.error(
        `cannot edit module model without module id. This shouldn't be able to happen`
      )
    }
  }
  const editModuleSlot = (selectedSlot: string) => {
    if (selectedSlot && moduleOnDeck && moduleOnDeck.slot !== selectedSlot) {
      dispatch(moveDeckItem(moduleOnDeck.slot, selectedSlot))
    }
  }

  const changeModuleWarning = useBlockingHint({
    hintKey: 'change_magnet_module_model',
    handleCancel: () => {
      displayModuleWarning(null)
    },
    handleContinue: () => {
      if (changeModuleWarningInfo) {
        editModuleModel(changeModuleWarningInfo.model)
        editModuleSlot(changeModuleWarningInfo.slot)
      } else {
        console.error('no module info set, could not edit module')
      }
      displayModuleWarning(null)
      onCloseClick()
    },
    content: <MagneticModuleWarningModalContent />,
    enabled: changeModuleWarningInfo !== null,
  })

  return (
    changeModuleWarning || (
      <EditModulesModal
        moduleType={moduleType}
        moduleOnDeck={moduleOnDeck}
        onCloseClick={onCloseClick}
        editModuleSlot={editModuleSlot}
        editModuleModel={editModuleModel}
        displayModuleWarning={displayModuleWarning}
      />
    )
  )
}
