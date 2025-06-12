import { useCallback, useContext, useEffect, useRef } from 'react'
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

import { useToaster } from '/app/organisms/ToasterOven'
import { checkShellUpdate } from '/app/redux/shell'

import { useNotifyDeckConfigurationQuery } from '../resources/deck_configuration'
import { useAttachedPipettes } from '../resources/instruments'
import { useAttachedModules } from '../resources/modules'
import { useCurrentRunId } from '../resources/runs'
import { SharedScrollRefContext } from './ODDProviders/ScrollRefProvider'

import type { AttachedModule } from '@opentrons/api-client'
import type { SetStatusBarCreateCommand } from '@opentrons/shared-data'
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

export function useGetNewModules(): AttachedModule[] {
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
    const newModules = attachedModules.filter(
      m =>
        m.moduleOffset === undefined &&
        !modulesInDeckConfig.includes(m.serialNumber)
    )
    return newModules
  }
  return []
}

export function useModuleAttachedToast(
  launchModuleSetupCallback: () => void
): void {
  const newModules = useGetNewModules()
  const currentRunId = useCurrentRunId({ refetchInterval: CURRENT_RUN_POLL })
  const attachedPipettes = useAttachedPipettes(newModules.length > 0)
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])
  const { makeToast } = useToaster()
  const moduleSerials = newModules.map(m => m.serialNumber)
  const moduleSerialsRef = useRef(moduleSerials)
  const runInProgress = currentRunId != null

  useEffect(() => {
    const newModuleSerials = difference(moduleSerials, moduleSerialsRef.current)
    const hasPipette =
      attachedPipettes.left != null || attachedPipettes.right != null
    if (!runInProgress && hasPipette && newModuleSerials.length > 0) {
      makeToast(t('module_added') as string, 'info', {
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        linkText: t('module_added_link'),
        onLinkClick: launchModuleSetupCallback,
        disableTimeout: true,
        displayType: 'odd',
      })
    }
    moduleSerialsRef.current = moduleSerials
    // dont want this hook to rerun when other deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSerials, runInProgress])
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
