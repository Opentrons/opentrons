// @flow
import * as React from 'react'
import { AlertModal, Flex, InputField, SecondaryBtn, Text } from '@opentrons/components'
import { sendModuleCommand } from '../../redux/modules'
import { Portal } from '../../App/portal'


import type {
  MagneticModule,
  ModuleCommand,
} from '../../redux/modules/types'
import { getModuleDisplayName } from '@opentrons/shared-data'

type Props = {|
  module: MagneticModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
|}

export const MagnetControl = ({ module, sendModuleCommand }: Props): React.Node => {
  const [engageHeightValue, setEngageHeightValue] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const isEngaged = module.status === 'engaged'

  const handleClick = () => {
    if (isEngaged) {
      sendModuleCommand(module.serial, 'deactivate')
    } else {
      setIsModalOpen(true) 
    }
  }
  
  const handleSumbitHeight = () => {
    if (engageHeightValue != null) {
      sendModuleCommand(module.serial, 'engage', [
        Number(engageHeightValue),
      ])
    }
    setIsModalOpen(false)
    setEngageHeightValue(null)
  }
  const displayName = getModuleDisplayName(module.model)
  const alertHeading = `Set Engage Height for ${displayName}`

  return (
    <>
      {isModalOpen && (
        <Portal>
          <AlertModal
            heading={alertHeading}
            iconName={null}
            buttons={[
              {
                children: 'Cancel',
                onClick: () => setIsModalOpen(false),
              },
              {
                children: 'Save',
                disabled: engageHeightValue == null,
                onClick: handleSumbitHeight,
              },
            ]}
            alertOverlay
          >
            <Text>"Set the engage height for this magnetic module."</Text>
            <InputField
                  units="mm"
                  value={engageHeightValue}
                  onChange={e => setEngageHeightValue(e.target.value)}
                />
          </AlertModal>
        </Portal>
      )}
      <SecondaryBtn width="10rem" onClick={handleClick}>
        {module.status === 'engaged' ? 'Deactivate' : 'Engage'}
      </SecondaryBtn>
    </>
  )

}
