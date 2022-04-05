import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { Slideout } from '../../../atoms/Slideout'
import { PrimaryButton } from '../../../atoms/Buttons'

export function NetworkingSlideout() {
  const { t } = useTranslation('device_settings')

  // Todo
  // when a user selects a wifi network, show a textbox for password
  // and activate the connect to network button
  // when a use clicks the connect to network button, close the slideout immediately

  return (
    <Slideout
      title={t('wireless_network_connect')}
      onCloseClick={}
      isExpanded={undefined}
      height="100%"
      footer={
        <PrimaryButton onClick={null} width="100%">
          {t('wireless_connect_button')}
        </PrimaryButton>
      }
    >
      <Flex></Flex>
    </Slideout>
  )
}
