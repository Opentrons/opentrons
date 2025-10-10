import { BrowserWindow, shell } from 'electron'

import {
  SECONDARY_WINDOW_CONFIG,
  SECONDARY_WINDOW_OPTS,
  SECONDARY_WINDOW_URL_PATH,
} from '../ui'

import type { Logger } from 'winston'
import type { SecondaryWindowDetails } from '../types'

interface StepDetailViewerDetails extends SecondaryWindowDetails {
  type: 'step-detail-viewer'
}

interface OpenStepDetailViewerParams {
  protocolKey: string
  log: Logger
}

export function openStepDetailViewer(
  params: OpenStepDetailViewerParams
): StepDetailViewerDetails {
  const createUi = (): BrowserWindow => createStepDetailViewerUi(params)
  const windowId = getWindowIdStepDetailViewer(params.protocolKey)

  return { createUi, windowId, type: 'step-detail-viewer' }
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

function createStepDetailViewerUi({
  log,
  protocolKey,
}: OpenStepDetailViewerParams): BrowserWindow {
  log.debug('Creating step detail viewer window', {
    protocolKey,
  })

  const stepDetailViewerWindow = new BrowserWindow({
    ...SECONDARY_WINDOW_OPTS,
    width: 400,
    height: 300,
    minWidth: 300,
    minHeight: 200,
  }).once('ready-to-show', () => {
    log.debug('Step detail viewer window ready to show')
    stepDetailViewerWindow.setTitle('Protocol Visualization')
    stepDetailViewerWindow.show()
  })

  const url = STEP_DETAIL_VIEWER_URL(protocolKey)
  log.info(`Loading step detail viewer from ${url}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  stepDetailViewerWindow.loadURL(url, {
    extraHeaders: 'pragma: no-cache\n',
  })

  stepDetailViewerWindow.webContents.setWindowOpenHandler(({ url }) => {
    // eslint-disable-next-line no-void
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return stepDetailViewerWindow
}
