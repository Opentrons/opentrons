import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { SPACING, TYPOGRAPHY, Btn, useInterval } from '@opentrons/components'
import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { checkShellUpdate } from '../../redux/shell'
import { getBuildrootUpdateDisplayInfo } from '../../redux/buildroot'
import { SoftwareUpdateModal } from '../Devices/RobotSettings/AdvancedTab/SoftwareUpdateModal'

import type { StyleProps } from '@opentrons/components'
import type { State, Dispatch } from '../../redux/types'

interface UpdateRobotBannerProps extends StyleProps {
  robotName: string
}

const UPDATE_RECHECK_DELAY_MS = 60000

export function UpdateRobotBanner(props: UpdateRobotBannerProps): JSX.Element {
  const { robotName, ...styleProps } = props
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  const { autoUpdateAction } = useSelector((state: State) => {
    return getBuildrootUpdateDisplayInfo(state, robotName)
  })
  const [showUpdateBanner, setShowUpdateBanner] = React.useState<boolean>(
    ['upgrade', 'downgrade'].includes(autoUpdateAction)
  )
  const [
    showSoftwareUpdateModal,
    setShowSoftwareUpdateModal,
  ] = React.useState<boolean>(false)

  // check for available updates
  useInterval(checkAppUpdate, UPDATE_RECHECK_DELAY_MS)

  const handleLaunchModal: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowSoftwareUpdateModal(true)
  }
  const handleCloseBanner: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowUpdateBanner(false)
  }

  return (
    <>
      {showUpdateBanner ? (
        <Banner type="warning" onCloseClick={handleCloseBanner} {...styleProps}>
          <StyledText as="p" marginRight={SPACING.spacing2}>
            {t('robot_server_versions_banner_title')}
          </StyledText>
          <Btn
            onClick={handleLaunchModal}
            css={TYPOGRAPHY.pRegular}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            {t('robot_server_versions_view_update')}
          </Btn>
        </Banner>
      ) : null}
      {showSoftwareUpdateModal ? (
        <Portal level="top">
          <SoftwareUpdateModal
            robotName={robotName}
            closeModal={() => setShowSoftwareUpdateModal(false)}
          />
        </Portal>
      ) : null}
    </>
  )
}
