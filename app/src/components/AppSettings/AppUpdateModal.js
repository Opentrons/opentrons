// @flow
// AlertModal for updating to newest app version
import * as React from 'react'

import {AlertModal} from '@opentrons/components'

// type Props = {
//   onUpdateClick: () => *,
//   onCloseClick: () => *
// }

const HEADING = 'App Update Available'

const UPDATE_MESSAGE = 'We recommend updating to the latest software version'

export default function AppUpdateModal () {
  const onUpdateClick = () => console.log('update')
  const onCloseClick = () => console.log('close')

  return (
    <AlertModal
      heading={HEADING}
      onCloseClick={onCloseClick}
      buttons={[
        {onClick: onCloseClick, children: 'not now'},
        {onClick: onUpdateClick, children: 'update'}
      ]}
    >
      {UPDATE_MESSAGE}
    </AlertModal>
  )
}
