import { useTranslation } from 'react-i18next'

import type { DeleteRecordsType } from '../types'

export function useDeleteRecordsText(type: DeleteRecordsType): {
  title: string
  description: string
  recommendation: string
} {
  const { t } = useTranslation('device_details')
  switch (type) {
    case 'allRuns':
      return {
        title: t('delete_all_run_records'),
        description: t('delete_all_run_records_description'),
        recommendation: t('delete_all_run_records_recommendation'),
      }
    case 'selectedRuns':
      return {
        title: t('delete_selected_run_records'),
        description: t('delete_selected_run_records_description'),
        recommendation: t('delete_selected_run_records_recommendation'),
      }
    case 'allLogs':
      return {
        title: t('delete_all_logs'),
        description: t('delete_all_logs_description'),
        recommendation: t('delete_all_logs_recommendation'),
      }
  }
}
