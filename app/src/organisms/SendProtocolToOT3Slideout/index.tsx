import * as React from 'react'
import path from 'path'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useCreateProtocolMutation } from '@opentrons/react-api-client'

import { FLEX_DISPLAY_NAME } from '@opentrons/shared-data'

import { PrimaryButton, IconProps, StyleProps } from '@opentrons/components'
import { ERROR_TOAST, INFO_TOAST, SUCCESS_TOAST } from '../../atoms/Toast'
import { ChooseRobotSlideout } from '../../organisms/ChooseRobotSlideout'
import {
  getAnalysisStatus,
  getProtocolDisplayName,
} from '../../organisms/ProtocolsLanding/utils'
import { useToaster } from '../../organisms/ToasterOven'
import { appShellRequestor } from '../../redux/shell/remote'
import { OPENTRONS_USB } from '../../redux/discovery'
import { getIsProtocolAnalysisInProgress } from '../../redux/protocol-storage'

import type { AxiosError } from 'axios'
import { getRobotUpdateDisplayInfo } from '../../redux/robot-update'
import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'
import { getValidCustomLabwareFiles } from '../../redux/custom-labware'

interface SendProtocolToOT3SlideoutProps extends StyleProps {
  storedProtocolData: StoredProtocolData
  onCloseClick: () => void
  isExpanded: boolean
}

export function SendProtocolToOT3Slideout(
  props: SendProtocolToOT3SlideoutProps
): JSX.Element | null {
  const { isExpanded, onCloseClick, storedProtocolData } = props
  const {
    protocolKey,
    srcFileNames,
    srcFiles,
    mostRecentAnalysis,
  } = storedProtocolData
  const { t } = useTranslation(['protocol_details', 'protocol_list'])

  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(null)

  const isSelectedRobotOnWrongVersionOfSoftware = [
    'upgrade',
    'downgrade',
  ].includes(
    useSelector((state: State) => {
      const updateInfo =
        selectedRobot != null
          ? getRobotUpdateDisplayInfo(state, selectedRobot.name)
          : { autoUpdateAction: '' }
      return updateInfo
    })?.autoUpdateAction
  )

  const { eatToast, makeToast } = useToaster()

  const { mutateAsync: createProtocolAsync } = useCreateProtocolMutation(
    {},
    selectedRobot != null
      ? {
          hostname: selectedRobot.ip,
          requestor:
            selectedRobot?.ip === OPENTRONS_USB ? appShellRequestor : undefined,
        }
      : null
  )

  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )
  const customLabwareFiles = useSelector(getValidCustomLabwareFiles)

  const analysisStatus = getAnalysisStatus(isAnalyzing, mostRecentAnalysis)

  const isAnalysisError = analysisStatus === 'error'

  if (protocolKey == null || srcFileNames == null || srcFiles == null) {
    // TODO: do more robust corrupt file catching and handling here
    return null
  }

  const srcFileObjects = srcFiles.map((srcFileBuffer, index) => {
    const srcFilePath = srcFileNames[index]
    return new File([srcFileBuffer], path.basename(srcFilePath))
  })

  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  const icon: IconProps = { name: 'ot-spinner', spin: true }

  const handleSendClick = (): void => {
    const toastId = makeToast(selectedRobot?.name ?? '', INFO_TOAST, {
      heading: `${t('sending')} ${protocolDisplayName}`,
      icon,
      maxWidth: '31.25rem',
      disableTimeout: true,
    })

    createProtocolAsync({
      files: [...srcFileObjects, ...customLabwareFiles],
      protocolKey,
    })
      .then(() => {
        eatToast(toastId)
        makeToast(selectedRobot?.name ?? '', SUCCESS_TOAST, {
          heading: `${t('successfully_sent')} ${protocolDisplayName}`,
        })
        onCloseClick()
      })
      .catch(
        (
          error: AxiosError<{
            errors: Array<{ id: string; detail: string; title: string }>
          }>
        ) => {
          eatToast(toastId)
          const [errorDetail] = error?.response?.data?.errors ?? []
          const { id, detail, title } = errorDetail ?? {}
          if (id != null && detail != null && title != null) {
            makeToast(detail, ERROR_TOAST, {
              closeButton: true,
              disableTimeout: true,
              heading: `${protocolDisplayName} ${title} - ${
                selectedRobot?.name ?? ''
              }`,
            })
          } else {
            makeToast(selectedRobot?.name ?? '', ERROR_TOAST, {
              closeButton: true,
              disableTimeout: true,
              heading: `${t('unsuccessfully_sent')} ${protocolDisplayName}`,
            })
          }
          onCloseClick()
        }
      )
  }

  return (
    <ChooseRobotSlideout
      isExpanded={isExpanded}
      onCloseClick={onCloseClick}
      title={t('protocol_list:send_to_robot', {
        robot_display_name: FLEX_DISPLAY_NAME,
      })}
      footer={
        <PrimaryButton
          disabled={
            selectedRobot == null || isSelectedRobotOnWrongVersionOfSoftware
          }
          onClick={handleSendClick}
          width="100%"
        >
          {t('protocol_details:send')}
        </PrimaryButton>
      }
      selectedRobot={selectedRobot}
      setSelectedRobot={setSelectedRobot}
      showOT3Only
      isAnalysisError={isAnalysisError}
    />
  )
}
