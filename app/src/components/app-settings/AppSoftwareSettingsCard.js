// @flow
// app info card with version and updated
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  ALIGN_START,
  BORDER_SOLID_LIGHT,
  SPACING_3,
  SPACING_AUTO,
  Card,
  Flex,
  LabeledValue,
  SecondaryBtn,
  useMountEffect,
} from '@opentrons/components'

import {
  CURRENT_VERSION,
  getAvailableShellUpdate,
  checkShellUpdate,
} from '../../shell'

import { Portal } from '../portal'
import { UpdateAppModal } from './UpdateAppModal'
import { UpdateNotificationsControl } from './UpdateNotificationsControl'
import { DowngradeAppControl } from './DowngradeAppControl'

import type { Dispatch } from '../../types'

const APP_SOFTWARE_SETTINGS = 'App Software Settings'
const VERSION_LABEL = 'Software Version'

const UPDATE_AVAILABLE = 'view available update'
const UPDATE_NOT_AVAILABLE = 'up to date'

export function AppSoftwareSettingsCard(): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const [showUpdateModal, setShowUpdateModal] = React.useState(false)
  const updateAvailable = Boolean(useSelector(getAvailableShellUpdate))

  useMountEffect(() => {
    dispatch(checkShellUpdate())
  })

  return (
    <>
      <Card title={APP_SOFTWARE_SETTINGS}>
        <Flex padding={SPACING_3} alignItems={ALIGN_START}>
          <LabeledValue label={VERSION_LABEL} value={CURRENT_VERSION} />
          <SecondaryBtn
            disabled={!updateAvailable}
            marginLeft={SPACING_AUTO}
            onClick={() => setShowUpdateModal(true)}
          >
            {updateAvailable ? UPDATE_AVAILABLE : UPDATE_NOT_AVAILABLE}
          </SecondaryBtn>
        </Flex>
        <UpdateNotificationsControl borderTop={BORDER_SOLID_LIGHT} />
        <DowngradeAppControl borderTop={BORDER_SOLID_LIGHT} />
      </Card>
      {showUpdateModal ? (
        <Portal>
          <UpdateAppModal closeModal={() => setShowUpdateModal(false)} />
        </Portal>
      ) : null}
    </>
  )
}
