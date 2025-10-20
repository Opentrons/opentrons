import { BrowserWindow, ipcMain, shell } from 'electron'

import {
  SECONDARY_WINDOW_CONFIG,
  SECONDARY_WINDOW_OPTS,
  SECONDARY_WINDOW_URL_PATH,
} from '../ui'

import type { Logger } from 'winston'
import type {
  Liquid,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'
import type { SecondaryWindowDetails } from '../types'

interface StepDetailViewerDetails extends SecondaryWindowDetails {
  type: 'step-detail-viewer'
}

interface UpdateStepDetailViewerDetails extends SecondaryWindowDetails {
  type: 'step-detail-data-updated'
}

interface OpenStepDetailViewerParams {
  protocolKey: string
  slot: string
  command: RunTimeCommand
  robotState: RobotState
  invariantContext: InvariantContext
  analysis: ProtocolAnalysisOutput
  liquids: Liquid[]
  log: Logger
}

export function openStepDetailViewer(
  params: OpenStepDetailViewerParams
): StepDetailViewerDetails {
  const createUi = (): BrowserWindow => createStepDetailViewerUi(params)
  const windowId = getWindowIdStepDetailViewer(params.protocolKey)

  return { createUi, windowId, type: 'step-detail-viewer' }
}

export function updateStepDetailViewerData(
  protocolKey: string,
  newData: Partial<Omit<OpenStepDetailViewerParams, 'log'>>
): UpdateStepDetailViewerDetails | undefined {
  const existing = stepDetailDataStore.get(protocolKey)
  if (!existing) return

  const updated = { ...existing, ...newData }
  stepDetailDataStore.set(protocolKey, updated)

  // notify all windows
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('step-detail-data-updated', protocolKey)
  })
}

function getWindowIdStepDetailViewer(protocolKey: string): string {
  return `step-detail-viewer-${protocolKey}`
}

const STEP_DETAIL_VIEWER_URL = (protocolKey: string): string => {
  return `${
    SECONDARY_WINDOW_CONFIG.url.protocol
  }//${SECONDARY_WINDOW_URL_PATH}#/protocols/${encodeURIComponent(
    protocolKey
  )}/visualization`
}
const stepDetailDataStore = new Map<
  string,
  Omit<OpenStepDetailViewerParams, 'log'>
>()

let stepDetailViewerWindow: BrowserWindow | null = null

export function createStepDetailViewerUi({
  log,
  protocolKey,
  analysis,
  robotState,
  invariantContext,
  command,
  slot,
  liquids,
}: OpenStepDetailViewerParams): BrowserWindow {
  log.debug('Creating step detail viewer window', { protocolKey })

  // store the data by protocolKey
  stepDetailDataStore.set(protocolKey, {
    protocolKey,
    analysis,
    robotState,
    invariantContext,
    command,
    slot,
    liquids,
  })

  stepDetailViewerWindow = new BrowserWindow({
    ...SECONDARY_WINDOW_OPTS,
    width: 400,
    height: 300,
    minWidth: 300,
    minHeight: 200,
  })

  stepDetailViewerWindow.once('ready-to-show', () => {
    log.debug('Step detail viewer window ready to show')
    stepDetailViewerWindow?.setTitle('Slot Spotlight')
    stepDetailViewerWindow?.show()
  })

  const url = STEP_DETAIL_VIEWER_URL(protocolKey)
  log.info(`Loading step detail viewer from ${url}`)
  stepDetailViewerWindow.loadURL(url, {
    extraHeaders: 'pragma: no-cache\n',
  })

  stepDetailViewerWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // rest this variable once the window is closed
  stepDetailViewerWindow.on('closed', () => {
    stepDetailViewerWindow = null
  })

  return stepDetailViewerWindow
}

//  ipcMain handlers that allows to fetch the current state of data and to determine
//  if the secondary window is open
ipcMain.handle('get-step-detail-data', (_event, protocolKey: string) => {
  return stepDetailDataStore.get(protocolKey)
})

ipcMain.handle('is-step-detail-viewer-open', () => {
  return stepDetailViewerWindow != null && !stepDetailViewerWindow.isDestroyed()
})
