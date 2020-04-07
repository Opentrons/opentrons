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

type EditModulesProps = {
  currentModule: {
    moduleId: ?string,
    moduleType: ModuleRealType,
  },
  onCloseClick: () => mixed,
}

export const EditModules = (props: EditModulesProps) => {
  const { onCloseClick, currentModule } = props
  const { moduleId, moduleType } = currentModule
  const _initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)

  const moduleOnDeck = moduleId ? _initialDeckSetup.modules[moduleId] : null
  const [moduleModel, setModuleModel] = useState<null | ModuleModel>(null)
  const dispatch = useDispatch()

  const editModule = (selectedModel: ModuleModel) => {
    if (moduleOnDeck?.id != null) {
      dispatch(
        stepFormActions.editModule({
          id: moduleOnDeck.id,
          model: selectedModel,
        })
      )
    } else {
      console.error(
        `cannot edit module without module id. This shouldn't be able to happen`
      )
    }
  }

  const changeModuleWarning = useBlockingHint({
    hintKey: 'change_magnet_module_model',
    handleCancel: () => {
      setModuleModel(null)
    },
    handleContinue: () => {
      if (moduleModel) {
        editModule(moduleModel)
      } else {
        console.error('no enqueuedModuleModel, could not edit module')
      }
      setModuleModel(null)
      onCloseClick()
    },
    content: <MagneticModuleWarningModalContent />,
    enabled: moduleModel !== null,
  })

  return (
    changeModuleWarning || (
      <EditModulesModalNew
        moduleId={moduleId}
        moduleType={moduleType}
        onCloseClick={() => null}
      />
    )
  )
}
