import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@opentrons/components'
import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { DiagnosticFiles } from './DiagnosticFiles'
import styles from './filemanager.module.css'
import { ConfirmDeleteAllRunRecordsModal } from './FileManagerWizardFlows/ConfirmDeleteAllRunRecordsModal'
import { DeleteProtocolRunRecordsWizard } from './FileManagerWizardFlows/DeleteProtocolRunRecordsWizard'
import { DownloadDiagnosticFilesWizard } from './FileManagerWizardFlows/DownloadDiagnosticFilesWizard'
import { DownloadProtocolRunRecordsWizard } from './FileManagerWizardFlows/DownloadProtocolRunRecordsWizard'
import { ProtocolRunRecords } from './ProtocolRunRecords'

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
  const [showDeleteAllRunsConfirmModal, setShowDeleteAllRunsConfirmModal] =
    useState(false)
  const [showDeleteAllRunsWizard, setShowDeleteAllRunsWizard] = useState(false)
  const { data: accessControlData } = useAccessControlEnabledQuery()
  const isComplianceReady =
    accessControlData?.data?.accessControlEnabled ?? false

  const hasRuns = (useNotifyAllRunsQuery().data?.data ?? []).length > 0

  const showDeleteAll = activeTab === 'records' && hasRuns

  const showDownloadAll =
    activeTab === 'diagnostic' || (activeTab === 'records' && hasRuns)

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
    } else if (activeTab === 'records') {
      setShowDeleteAllRunsConfirmModal(true)
    }
  }

  const primaryButtonProps: Partial<ComponentProps<typeof ChildNavigation>> =
    showDeleteAll
      ? {
          buttonText: t('delete_all'),
          buttonType: 'alert',
          buttonCategory: 'rounded',
        }
      : {
          buttonText: t('download_all'),
          buttonType: 'primary',
          iconName: 'download',
          iconPlacement: 'startIcon',
          buttonCategory: 'rounded',
        }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('file_manager')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
        {...(showDownloadAll ? primaryButtonProps : {})}
        onClickButton={handleClickButton}
        {...(secondaryButtonProps != null ? { secondaryButtonProps } : {})}
      />
      <div className={styles.content}>
        <div className={styles.tabs_row}>
          <Tabs tabs={tabs} />
        </div>
        <div className={styles.tab_content}>
          {activeTab === 'diagnostic' ? <DiagnosticFiles /> : null}
          {activeTab === 'records' ? <ProtocolRunRecords /> : null}
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
      {showDeleteAllRunsConfirmModal && activeTab === 'records' ? (
        <ConfirmDeleteAllRunRecordsModal
          onClose={() => {
            setShowDeleteAllRunsConfirmModal(false)
          }}
          onDownloadAll={() => {
            setShowDeleteAllRunsConfirmModal(false)
            setShowDownloadRecordsWizard(true)
          }}
          onConfirmDelete={() => {
            setShowDeleteAllRunsConfirmModal(false)
            setShowDeleteAllRunsWizard(true)
          }}
        />
      ) : null}
      {showDeleteAllRunsWizard && activeTab === 'records' ? (
        <DeleteProtocolRunRecordsWizard
          onClose={() => {
            setShowDeleteAllRunsWizard(false)
          }}
        />
      ) : null}
    </div>
  )
}
