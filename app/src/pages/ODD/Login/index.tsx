import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  Btn,
  Flex,
} from '@opentrons/components'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

export function Login(): JSX.Element {
  // const { t, i18n } = useTranslation([
  //   'protocol_setup',
  //   'devices_landing',
  //   'shared',
  // ])
  // const navigate = useNavigate()
  // const [showSetupInstructionsModal, setShowSetupInstructionsModal] =
  //   useState<boolean>(false)

  // const handleClickConfirm = (): void => {
  //   navigate(-1)
  // }

  return (
    <Flex>
      <ChildNavigation
        header='Login'
        buttonText='Login'
        onClickButton={() => {}}
      />
      <h4>username</h4>
      <input type="text" />
      <Btn onClick={() => {}}>Login</Btn>
    </Flex>
  )
}
