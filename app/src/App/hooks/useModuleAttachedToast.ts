import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import difference from 'lodash/difference'

import { useScrolling } from '@opentrons/components'
import { useCurrentAllSubsystemUpdatesQuery } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import { useCurrentRunId } from '/app/resources/runs'

import { SharedScrollRefContext } from '../ODDProviders/ScrollRefProvider'
import { useGetModulesNeedingSetupThatCanCurrentlyBeSetUp } from './useGetModulesNeedingSetup'

const CURRENT_RUN_POLL = 5000
const SUBSYSTEM_UPDATE_POLL = 5000

export function useModuleAttachedToast(
  launchModuleSetupCallback: (open: boolean) => void
): void {
  const currentlySetuppableModules =
    useGetModulesNeedingSetupThatCanCurrentlyBeSetUp()

  const currentRunId = useCurrentRunId({ refetchInterval: CURRENT_RUN_POLL })
  const { data: currentSubsystemsUpdatesData } =
    useCurrentAllSubsystemUpdatesQuery({
      refetchInterval: SUBSYSTEM_UPDATE_POLL,
    })
  const ongoingSubsystemUpdate = currentSubsystemsUpdatesData?.data.find(
    update =>
      update.updateStatus === 'queued' || update.updateStatus === 'updating'
  )

  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])
  const { makeToast, eatToast } = useToaster()
  const moduleSerials = currentlySetuppableModules.map(m => m.serialNumber)
  const moduleSerialsRef = useRef(moduleSerials)
  const runInProgress = currentRunId != null
  const [toastID, setToastID] = useState<string>('')

  const [firstRun, setFirstRun] = useState<boolean>(true)

  useEffect(
    () => {
      const newModuleSerials = difference(
        moduleSerials,
        moduleSerialsRef.current
      )
      if (
        !runInProgress &&
        ongoingSubsystemUpdate == null &&
        newModuleSerials.length > 0
      ) {
        setToastID(
          makeToast(t('module_added') as string, 'info', {
            buttonText: i18n.format(t('shared:close'), 'capitalize'),
            linkText: t('module_added_link'),
            onLinkClick: () => {
              launchModuleSetupCallback(true)
            },
            disableTimeout: true,
            displayType: 'odd',
          })
        )
      }

      moduleSerialsRef.current = moduleSerials
      setFirstRun(false)
      // dont want this hook to rerun when other deps change
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moduleSerials, runInProgress, firstRun]
  )

  useEffect(
    () => {
      // Close toast if there are no new modules to setup
      if (toastID && currentlySetuppableModules.length === 0) {
        launchModuleSetupCallback(false)
        eatToast(toastID)
        setToastID('')
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toastID, currentlySetuppableModules]
  )
}

export function useScrollRef(): {
  isScrolling: boolean
  refCallback: (node: HTMLElement | null) => void
  element: HTMLElement | null
} {
  const refData = useContext(SharedScrollRefContext)
  const isScrolling = useScrolling(refData?.element ?? null) // Assuming useScrolling is properly handling scroll state

  if (refData == null) {
    // log non critical error instead of throwing error to prevent white screens
    console.error(
      'useScrollRef must be used within a SharedScrollRefProvider. Falling back to dummy refs.'
    )
    return {
      refCallback: () => null,
      isScrolling: false,
      element: null,
    }
  }

  const { refCallback, element } = refData

  return {
    refCallback,
    isScrolling,
    element,
  }
}
