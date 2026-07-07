import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs } from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './filemanager.module.css'

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

  const showDeleteAll = activeTab === 'compliance' || activeTab === 'records'

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
        onClickButton={() => {}}
        {...(showDeleteAll
          ? {
              secondaryButtonProps: {
                buttonType: 'primary',
                buttonCategory: 'rounded',
                buttonText: t('download_all'),
                onClick: () => {},
                iconName: 'download',
                iconPlacement: 'startIcon',
              },
            }
          : { iconName: 'download', iconPlacement: 'startIcon' })}
      />
      <div className={styles.content}>
        <Tabs
          tabs={[
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
          ]}
        />
        {/* TODO: add content for each tab */}
        <div>{activeTab}</div>
      </div>
    </div>
  )
}
