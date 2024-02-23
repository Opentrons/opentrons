import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import last from 'lodash/last'

import { GET, request } from '@opentrons/api-client'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/buttons'
import { ERROR_TOAST, INFO_TOAST } from '../../../../atoms/Toast'
import { useToaster } from '../../../../organisms/ToasterOven'
import { CONNECTABLE } from '../../../../redux/discovery'
import { useRobot } from '../../hooks'

import type { IconProps } from '@opentrons/components'

interface TroubleshootingProps {
  robotName: string
  isEstopNotDisengaged: boolean
}

export function Troubleshooting({
  robotName,
  isEstopNotDisengaged,
}: TroubleshootingProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const robot = useRobot(robotName)
  const controlDisabled = robot?.status !== CONNECTABLE
  const logsAvailable = robot?.health != null && robot.health.logs != null
  const [
    isDownloadingRobotLogs,
    setIsDownloadingRobotLogs,
  ] = React.useState<boolean>(false)
  const { makeToast, eatToast } = useToaster()
  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const host = useHost()

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    setIsDownloadingRobotLogs(true)
    const toastId = makeToast(t('downloading_logs'), INFO_TOAST, {
      disableTimeout: true,
      icon: toastIcon,
    })

    if (
      !controlDisabled &&
      robot?.status === CONNECTABLE &&
      robot.health.logs != null &&
      host != null
    ) {
      const zip = new JSZip()

      Promise.all(
        robot.health.logs.map(log => {
          const logFileName: string = last(log.split('/')) ?? 'opentrons.log'
          return request<string>(GET, log, null, host)
            .then(res => {
              zip.file(logFileName, res.data)
            })
            .catch((e: Error) =>
              makeToast(e?.message, ERROR_TOAST, { closeButton: true })
            )
        })
      )
        .then(() => {
          zip
            .generateAsync({ type: 'blob' })
            .then(blob => {
              saveAs(blob, `${robotName}_logs.zip`)
            })
            .catch((e: Error) => {
              eatToast(toastId)
              makeToast(e?.message, ERROR_TOAST, { closeButton: true })
              // avoid no-op on unmount
              if (mounted.current != null) setIsDownloadingRobotLogs(false)
            })
        })
        .then(() => {
          eatToast(toastId)
          if (mounted.current != null) setIsDownloadingRobotLogs(false)
        })
        .catch((e: Error) => {
          eatToast(toastId)
          makeToast(e?.message, ERROR_TOAST, { closeButton: true })
          if (mounted.current != null) setIsDownloadingRobotLogs(false)
        })
    }
  }

  // set ref on component to check if component is mounted https://react.dev/reference/react/useRef#manipulating-the-dom-with-a-ref
  const mounted = React.useRef(null)

  return (
    <Flex
      ref={mounted}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginTop={SPACING.spacing24}
    >
      <Box width="70%">
        <StyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing20}
        >
          {t('troubleshooting')}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          data-testid="RobotSettings_Troubleshooting"
        >
          {t('download_logs')}
        </StyledText>
      </Box>
      <TertiaryButton
        disabled={
          controlDisabled ||
          logsAvailable == null ||
          isDownloadingRobotLogs ||
          isEstopNotDisengaged
        }
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        id="AdvancedSettings_downloadLogsButton"
      >
        {t('download_logs')}
      </TertiaryButton>
    </Flex>
  )
}
