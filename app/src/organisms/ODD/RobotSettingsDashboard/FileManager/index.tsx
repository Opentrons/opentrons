import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { DiagnosticFiles } from './DiagnosticFiles'
import { DownloadDiagnosticFilesModal } from './DownloadDiagnosticFilesModal'
import styles from './filemanager.module.css'

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
      {
        text: t('compliance_ready_files'),
        onClick: () => {
          setActiveTab('compliance')
        },
        isActive: activeTab === 'compliance',
      },
      {
        text: t('protocol_run_records'),
        onClick: () => {
          setActiveTab('records')
        },
        isActive: activeTab === 'records',
      },
    ]
  }, [activeTab, t])

  const secondaryButtonProps: ComponentProps<typeof SmallButton> | null =
    showDeleteAll
      ? {
          buttonType: 'primary',
          buttonCategory: 'rounded',
          buttonText: t('download_all'),
          onClick: () => {},
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
        <Tabs tabs={tabs} />
        {activeTab === 'diagnostic' ? <DiagnosticFiles /> : null}
      </div>
      {showDownloadModal && activeTab === 'diagnostic' ? (
        <DownloadDiagnosticFilesModal
          onClose={() => {
            setShowDownloadModal(false)
          }}
        />
      ) : null}
    </div>
  )
}
