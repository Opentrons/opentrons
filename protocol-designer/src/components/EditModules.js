// @flow
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { ModuleModel, ModuleRealType } from '@opentrons/shared-data'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
} from '../step-forms'
import { useBlockingHint } from './Hints/useBlockingHint'
import { MagneticModuleWarningModalContent } from './modals/EditModulesModal/MagneticModuleWarningModalContent'
import { EditModulesModalNew } from './modals/EditModulesModal/EditModulesModalNew'
import { moveDeckItem } from '../labware-ingred/actions/actions'

type EditModulesProps = {
  moduleToEdit: {
    moduleId: ?string,
    moduleType: ModuleRealType,
  },
  onCloseClick: () => mixed,
}

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
    setChangeModuleWarningInfo,
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
    } else {
      console.error(
        `cannot edit module slot without module slot. This shouldn't be able to happen`
      )
    }
  }

  const changeModuleWarning = useBlockingHint({
    hintKey: 'change_magnet_module_model',
    handleCancel: () => {
      setChangeModuleWarningInfo(null)
    },
    handleContinue: () => {
      if (changeModuleWarningInfo) {
        editModuleModel(changeModuleWarningInfo.model)
        editModuleSlot(changeModuleWarningInfo.slot)
      } else {
        console.error('no module info set, could not edit module')
      }
      setChangeModuleWarningInfo(null)
      onCloseClick()
    },
    content: <MagneticModuleWarningModalContent />,
    enabled: changeModuleWarningInfo !== null,
  })

  return (
    changeModuleWarning || (
      <EditModulesModalNew
        moduleId={moduleId}
        moduleType={moduleType}
        onCloseClick={onCloseClick}
        editModuleSlot={editModuleSlot}
        editModuleModel={editModuleModel}
        setChangeModuleWarningInfo={setChangeModuleWarningInfo}
      />
    )
  )
}
