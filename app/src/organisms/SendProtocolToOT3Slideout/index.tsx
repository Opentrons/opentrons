import * as React from 'react'
import path from 'path'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useCreateProtocolMutation } from '@opentrons/react-api-client'

import { PrimaryButton } from '../../atoms/buttons'
import {
  ERROR_TOAST,
  INFO_TOAST,
  SUCCESS_TOAST,
  useToast,
} from '../../atoms/Toast'
import { ChooseRobotSlideout } from '../../organisms/ChooseRobotSlideout'
import { getAnalysisStatus } from '../../organisms/ProtocolsLanding/utils'
import { getIsProtocolAnalysisInProgress } from '../../redux/protocol-storage'

import type { AxiosError } from 'axios'
import type { IconProps, StyleProps } from '@opentrons/components'
import type { Robot } from '../../redux/discovery/types'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'

interface SendProtocolToOT3SlideoutProps extends StyleProps {
  protocolDisplayName: string
  storedProtocolData: StoredProtocolData
  onCloseClick: () => void
  isExpanded: boolean
}

export function SendProtocolToOT3Slideout(
  props: SendProtocolToOT3SlideoutProps
): JSX.Element | null {
  const {
    isExpanded,
    onCloseClick,
    protocolDisplayName,
    storedProtocolData,
  } = props
  const { t } = useTranslation('protocol_details')

  const [selectedRobot, setSelectedRobot] = React.useState<Robot | null>(null)

  const { eatToast, makeToast } = useToast()

  const { mutateAsync: createProtocolAsync } = useCreateProtocolMutation(
    {},
    selectedRobot != null ? { hostname: selectedRobot.ip } : null
  )

  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )

  const analysisStatus = getAnalysisStatus(
    isAnalyzing,
    storedProtocolData.mostRecentAnalysis
  )

  const isAnalysisError = analysisStatus === 'error'

  const { protocolKey, srcFileNames, srcFiles } = storedProtocolData
  if (protocolKey == null || srcFileNames == null || srcFiles == null) {
    // TODO: do more robust corrupt file catching and handling here
    return null
  }

  const srcFileObjects = srcFiles.map((srcFileBuffer, index) => {
    const srcFilePath = srcFileNames[index]
    return new File([srcFileBuffer], path.basename(srcFilePath))
  })

  const icon: IconProps = { name: 'ot-spinner', spin: true }

  const handleSendClick = (): void => {
    const toastId = makeToast(selectedRobot?.name ?? '', INFO_TOAST, {
      heading: `${t('sending')} ${protocolDisplayName}`,
      icon,
      maxWidth: '31.25rem',
      disableTimeout: true,
    })

    createProtocolAsync({ files: srcFileObjects, protocolKey })
      .then(() => {
        eatToast(toastId)
        makeToast(selectedRobot?.name ?? '', SUCCESS_TOAST, {
          heading: `${t('successfully_sent')} ${protocolDisplayName}`,
        })
        onCloseClick()
      })
      .catch((error: AxiosError) => {
        eatToast(toastId)
        const { id, detail, title } = error?.response?.data.errors[0]
        if (id === 'ProtocolFilesInvalid') {
          makeToast(detail, ERROR_TOAST, {
            closeButton: true,
            disableTimeout: true,
            heading: `${protocolDisplayName} ${title} on ${
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
      })
  }

  return (
    <ChooseRobotSlideout
      isExpanded={isExpanded}
      onCloseClick={onCloseClick}
      title={t('send_protocol_to_ot3')}
      footer={
        <PrimaryButton
          disabled={selectedRobot == null}
          onClick={handleSendClick}
          width="100%"
        >
          {t('send')}
        </PrimaryButton>
      }
      selectedRobot={selectedRobot}
      setSelectedRobot={setSelectedRobot}
      showOT3Only
      isAnalysisError={isAnalysisError}
    />
  )
}
