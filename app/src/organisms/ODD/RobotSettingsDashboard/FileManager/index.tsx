import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@opentrons/components'
import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { DiagnosticFiles } from './DiagnosticFiles'
import styles from './filemanager.module.css'
import { DownloadDiagnosticFilesWizard } from './FileManagerWizardFlows/DownloadDiagnosticFilesWizard'
import { DownloadProtocolRunRecordsWizard } from './FileManagerWizardFlows/DownloadProtocolRunRecordsWizard'

import type { ComponentProps } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type { SetSettingOption } from '../types'

type FileManagerTab = 'diagnostic' | 'compliance' | 'records'

interface FileManagerProps {
  setCurrentOption: SetSettingOption
}

export function FileManager({
  setCurrentOption,
}: FileManagerProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const [activeTab, setActiveTab] = useState<FileManagerTab>('diagnostic')
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showDownloadRecordsWizard, setShowDownloadRecordsWizard] =
    useState(false)
  const { data: accessControlData } = useAccessControlEnabledQuery()
  const isComplianceReady =
    accessControlData?.data?.accessControlEnabled ?? false

  const showDeleteAll = activeTab === 'compliance' || activeTab === 'records'

  const tabs = useMemo(() => {
    return [
      {
        text: t('diagnostic_files'),
        onClick: () => {
          setActiveTab('diagnostic')
        },
        isActive: activeTab === 'diagnostic',
      },
      ...(isComplianceReady
        ? [
            {
              text: t('compliance_ready_files'),
              onClick: () => {
                setActiveTab('compliance')
              },
              isActive: activeTab === 'compliance',
            },
          ]
        : []),
      {
        text: t('protocol_run_records'),
        onClick: () => {
          setActiveTab('records')
        },
        isActive: activeTab === 'records',
      },
    ]
  }, [activeTab, t, isComplianceReady])

  const secondaryButtonProps: ComponentProps<typeof SmallButton> | null =
    showDeleteAll
      ? {
          buttonType: 'primary',
          buttonCategory: 'rounded',
          buttonText: t('download_all'),
          onClick: () => {
            if (activeTab === 'records') {
              setShowDownloadRecordsWizard(true)
            }
          },
          iconName: 'download',
          iconPlacement: 'startIcon',
        }
      : null

  const handleClickButton = (): void => {
    if (activeTab === 'diagnostic') {
      setShowDownloadModal(true)
    }
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('file_manager')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
        buttonText={showDeleteAll ? t('delete_all') : t('download_all')}
        buttonType={showDeleteAll ? 'alert' : 'primary'}
        buttonCategory="rounded"
        iconName={showDeleteAll ? undefined : 'download'}
        iconPlacement={showDeleteAll ? undefined : 'startIcon'}
        onClickButton={handleClickButton}
        {...(secondaryButtonProps != null ? { secondaryButtonProps } : {})}
      />
      <div className={styles.content}>
        <div className={styles.tabs_row}>
          <Tabs tabs={tabs} />
        </div>
        <div className={styles.tab_content}>
          {activeTab === 'diagnostic' ? <DiagnosticFiles /> : null}
        </div>
      </div>
      {showDownloadModal && activeTab === 'diagnostic' ? (
        <DownloadDiagnosticFilesWizard
          onClose={() => {
            setShowDownloadModal(false)
          }}
        />
      ) : null}
      {showDownloadRecordsWizard && activeTab === 'records' ? (
        <DownloadProtocolRunRecordsWizard
          onClose={() => {
            setShowDownloadRecordsWizard(false)
          }}
        />
      ) : null}
    </div>
  )
}
