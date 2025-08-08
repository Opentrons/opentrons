import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useDispatch } from 'react-redux'
import difference from 'lodash/difference'

import { getProtocol } from '@opentrons/api-client'
import {
  truncateString,
  useInterval,
  useScrolling,
} from '@opentrons/components'
import {
  useAllProtocolIdsQuery,
  useCreateLiveCommandMutation,
  useHost,
} from '@opentrons/react-api-client'
import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { useToaster } from '/app/organisms/ToasterOven'
import { checkShellUpdate } from '/app/redux/shell'

import { useNotifyDeckConfigurationQuery } from '../resources/deck_configuration'
import { useAttachedPipettes } from '../resources/instruments'
import { useAttachedModules } from '../resources/modules'
import { useCurrentRunId } from '../resources/runs'
import { SharedScrollRefContext } from './ODDProviders/ScrollRefProvider'

import type { AttachedModule } from '@opentrons/api-client'
import type {
  ModuleType,
  SetStatusBarCreateCommand,
} from '@opentrons/shared-data'
import type { Dispatch } from '/app/redux/types'

const UPDATE_RECHECK_INTERVAL_MS = 60000
const PROTOCOL_IDS_RECHECK_INTERVAL_MS = 3000
const ATTACHED_MODULE_POLL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000
const CURRENT_RUN_POLL = 5000

export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}

export function useProtocolReceiptToast(): void {
  const host = useHost()
  const { t, i18n } = useTranslation(['protocol_info', 'shared'])
  const { makeToast } = useToaster()
  const queryClient = useQueryClient()
  const protocolIdsQuery = useAllProtocolIdsQuery(
    {
      refetchInterval: PROTOCOL_IDS_RECHECK_INTERVAL_MS,
    },
    true
  )
  const protocolIds = protocolIdsQuery.data?.data ?? []
  const protocolIdsRef = useRef(protocolIds)
  const hasRefetched = useRef(true)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const animationCommand: SetStatusBarCreateCommand = {
    commandType: 'setStatusBar',
    params: { animation: 'confirm' },
  }

  if (protocolIdsQuery.isRefetching) {
    hasRefetched.current = false
  }

  useEffect(() => {
    const newProtocolIds = difference(protocolIds, protocolIdsRef.current)
    if (!hasRefetched.current && newProtocolIds.length > 0) {
      Promise.all(
        newProtocolIds.map(protocolId => {
          if (host != null) {
            return (
              getProtocol(host, protocolId).then(
                data =>
                  data.data.data.metadata.protocolName ??
                  data.data.data.files[0].name
              ) ?? ''
            )
          } else {
            return Promise.reject(
              new Error(
                'no host provider info inside of useProtocolReceiptToast'
              )
            )
          }
        })
      )
        .then(protocolNames => {
          protocolNames.forEach(name => {
            makeToast(
              t('protocol_added', {
                protocol_name: truncateString(name, 30),
              }) as string,
              'success',
              {
                buttonText: i18n.format(t('shared:close'), 'capitalize'),
                disableTimeout: true,
                displayType: 'odd',
              }
            )
          })
        })
        .then(() => {
          queryClient
            .invalidateQueries([host, 'protocols'])
            .catch((e: Error) => {
              console.error(`error invalidating protocols query: ${e.message}`)
            })
        })
        .then(() => {
          createLiveCommand({
            command: animationCommand,
          }).catch((e: Error) => {
            console.warn(`cannot run status bar animation: ${e.message}`)
          })
        })
        .catch((e: Error) => {
          console.error(e)
        })
    }
    protocolIdsRef.current = protocolIds
    // dont want this hook to rerun when other deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolIds])
}

const MODULES_NOT_REQUIRING_PIPETTE_FOR_SETUP: ModuleType[] = [
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
]

const MODULES_NOT_REQUIRING_CALIBRATION = MODULES_NOT_REQUIRING_PIPETTE_FOR_SETUP

export function useGetUnlocatedModules(): AttachedModule[] {
  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []
  const deckConfig = useNotifyDeckConfigurationQuery({
    enabled: attachedModules.length > 0,
    refetchInterval: DECK_CONFIG_POLL_MS,
  }).data
  if (deckConfig != null && attachedModules.length > 0) {
    const modulesInDeckConfig = deckConfig
      ?.filter(c => c.opentronsModuleSerialNumber)
      .map(m => m.opentronsModuleSerialNumber)
    return attachedModules.filter(
      m => !modulesInDeckConfig.includes(m.serialNumber)
    )
  }
  return []
}

export function useGetModulesNeedingSetup(): AttachedModule[] {
  const allNewModules = useGetUnlocatedModules()
  console.log(`ugmns: ${allNewModules}`)
  return allNewModules.filter(
    m =>
      MODULES_NOT_REQUIRING_CALIBRATION.includes(m.moduleType) ||
      m.moduleOffset === undefined
  )
}

export function useGetModulesNeedingSetupThatCanCurrentlyBeSetUp(): AttachedModule[] {
  const modulesRequiringSetup = useGetModulesNeedingSetup()
  const attachedPipettes = useAttachedPipettes(modulesRequiringSetup.length > 0)
  console.log(`ugmnstccbs: ${modulesRequiringSetup}`)
  return modulesRequiringSetup.filter(
    m =>
      MODULES_NOT_REQUIRING_PIPETTE_FOR_SETUP.includes(m.moduleType) ||
      attachedPipettes.left != null ||
      attachedPipettes.right != null
  )
}

export function useModuleAttachedToast(
  launchModuleSetupCallback: () => void
): void {
  const currentlySetuppableModules = useGetModulesNeedingSetupThatCanCurrentlyBeSetUp()
  console.log(`umat: ${currentlySetuppableModules}`)

  const currentRunId = useCurrentRunId({ refetchInterval: CURRENT_RUN_POLL })
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])
  const { makeToast } = useToaster()
  const moduleSerials = currentlySetuppableModules.map(m => m.serialNumber)
  const moduleSerialsRef = useRef(moduleSerials)
  const runInProgress = currentRunId != null

  const [firstRun, setFirstRun] = useState<boolean>(true)

  useEffect(() => {
    const newModuleSerials = difference(moduleSerials, moduleSerialsRef.current)
    console.log(`umat effect: ${newModuleSerials}`)
    if (!runInProgress && newModuleSerials.length > 0) {
      makeToast(t('module_added') as string, 'info', {
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        linkText: t('module_added_link'),
        onLinkClick: launchModuleSetupCallback,
        disableTimeout: true,
        displayType: 'odd',
      })
    }
    moduleSerialsRef.current = moduleSerials
    setFirstRun(false)
    // dont want this hook to rerun when other deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSerials, runInProgress, firstRun])
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
