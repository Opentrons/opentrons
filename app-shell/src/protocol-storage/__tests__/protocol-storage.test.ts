// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchProtocols,
  getParsedAnalysisFromPath,
  getUnixTimeFromAnalysisPath,
  registerProtocolStorage,
} from '../'
import { showSaveDialog } from '../../dialogs'
import { NOT_OT2_PROTOCOLS_DIRECTORY_PATH } from '../file-system'

import type { BrowserWindow } from 'electron'

vi.mock('electron-store')
vi.mock('../../log')
vi.mock('../../dialogs')
vi.mock('../../protocol-analysis')
vi.mock('../../config', () => ({
  getConfig: vi.fn((path?: string) => {
    if (path === 'devInternal') {
      return {}
    } else {
      return undefined
    }
  }),
}))

describe('protocol storage directory utilities', () => {
  let protocolsDir: string
  let mockAnalysisFilePath: string
  let mockDispatch: () => void
  let requiredRmdir: boolean

  beforeEach(() => {
    mockAnalysisFilePath = tempy.file({ extension: 'json' })
    protocolsDir = NOT_OT2_PROTOCOLS_DIRECTORY_PATH
    mockDispatch = vi.fn()
    requiredRmdir = true
  })

  afterEach(() => {
    return requiredRmdir
      ? (Promise.all([
          fs.rmdir(protocolsDir, { recursive: true }),
          fs.rm(mockAnalysisFilePath, { force: true }),
        ]) as any)
      : fs.rm(mockAnalysisFilePath, { force: true })
  })

  describe('fetchProtocols', () => {
    it('reads and parses directories', () => {
      const firstProtocolDirName = 'protocol_item_1'
      const secondProtocolDirName = 'protocol_item_2'

      return Promise.all([
        fs.emptyDir(path.join(protocolsDir, firstProtocolDirName)),
        fs.emptyDir(path.join(protocolsDir, firstProtocolDirName, 'src')),
        fs.createFile(
          path.join(protocolsDir, firstProtocolDirName, 'src', 'main.py')
        ),
        fs.emptyDir(path.join(protocolsDir, firstProtocolDirName, 'analysis')),
        fs.createFile(
          path.join(
            protocolsDir,
            firstProtocolDirName,
            'analysis',
            'fake_timestamp0.json'
          )
        ),
        fs.emptyDir(path.join(protocolsDir, secondProtocolDirName)),
        fs.emptyDir(path.join(protocolsDir, secondProtocolDirName, 'src')),
        fs.createFile(
          path.join(protocolsDir, secondProtocolDirName, 'src', 'main.json')
        ),
        fs.emptyDir(path.join(protocolsDir, secondProtocolDirName, 'analysis')),
        fs.createFile(
          path.join(
            protocolsDir,
            secondProtocolDirName,
            'analysis',
            'fake_timestamp1.json'
          )
        ),
      ])
        .then(() => fetchProtocols(mockDispatch, 'initial'))
        .then(() =>
          expect(mockDispatch).toHaveBeenCalledWith({
            type: 'protocolStorage:UPDATE_PROTOCOL_LIST',
            payload: expect.arrayContaining([
              expect.objectContaining({ protocolKey: 'protocol_item_1' }),
              expect.objectContaining({ protocolKey: 'protocol_item_2' }),
            ]),
            meta: { source: 'initial' },
          })
        )
    })
  })

  describe('registerProtocolStorage EXPORT_PROTOCOL', () => {
    const mockMainWindow = {} as unknown as BrowserWindow

    beforeEach(() => {
      vi.mocked(showSaveDialog).mockClear()
    })

    it('copies the protocol source file to the chosen destination', async () => {
      const destDir = tempy.directory()
      const destFilePath = path.join(destDir, 'exported.py')
      await fs.emptyDir(path.join(protocolsDir, 'abc123', 'src'))
      await fs.writeFile(
        path.join(protocolsDir, 'abc123', 'src', 'main.py'),
        'metadata = {}'
      )
      vi.mocked(showSaveDialog).mockResolvedValue(destFilePath)

      const handleAction = registerProtocolStorage(mockDispatch, mockMainWindow)
      handleAction({
        type: 'protocolStorage:EXPORT_PROTOCOL',
        payload: { protocolKey: 'abc123' },
        meta: { shell: true },
      } as any)

      await vi.waitFor(async () => {
        expect(await fs.readFile(destFilePath, 'utf8')).toBe('metadata = {}')
      })
      expect(vi.mocked(showSaveDialog)).toHaveBeenCalledWith(
        mockMainWindow,
        expect.objectContaining({
          defaultPath: expect.stringContaining('main.py'),
        })
      )
      await fs.rm(destDir, { recursive: true, force: true })
    })

    it('exports nothing when the save dialog is canceled', async () => {
      const destDir = tempy.directory()
      await fs.emptyDir(path.join(protocolsDir, 'abc123', 'src'))
      await fs.writeFile(
        path.join(protocolsDir, 'abc123', 'src', 'main.py'),
        'metadata = {}'
      )
      vi.mocked(showSaveDialog).mockResolvedValue(null)

      const handleAction = registerProtocolStorage(mockDispatch, mockMainWindow)
      handleAction({
        type: 'protocolStorage:EXPORT_PROTOCOL',
        payload: { protocolKey: 'abc123' },
        meta: { shell: true },
      } as any)

      await vi.waitFor(() => {
        expect(vi.mocked(showSaveDialog)).toHaveBeenCalled()
      })
      expect(await fs.readdir(destDir)).toEqual([])
      await fs.rm(destDir, { recursive: true, force: true })
    })
  })

  describe('getParsedAnalysis', () => {
    it('parses json if available', () => {
      requiredRmdir = false
      return fs
        .writeJson(mockAnalysisFilePath, {
          someKey: 1,
        })
        .then(() => {
          expect(getParsedAnalysisFromPath(mockAnalysisFilePath)).toEqual({
            someKey: 1,
          })
        })
    })
    it('returns failed analysis if parsing error', () => {
      requiredRmdir = false
      expect(getParsedAnalysisFromPath('non-existent-path.json')).toEqual({
        commands: [],
        liquids: [],
        config: {},
        createdAt: expect.any(String),
        errors: [
          {
            createdAt: expect.any(String),
            detail: expect.any(String),
            errorType: 'UnexpectedAnalysisError',
            id: expect.any(String),
          },
        ],
        files: [],
        metadata: [],
        pipettes: [],
        modules: [],
        labware: [],
        runTimeParameters: [],
        result: 'not-ok',
      })
    })
  })

  describe('getUnixTimeFromAnalysisPath', () => {
    it('parses unix time from analysis file path is parsable', () => {
      return fs.createFile(path.join(protocolsDir, '12345.json')).then(() => {
        expect(
          getUnixTimeFromAnalysisPath(path.join(protocolsDir, '12345.json'))
        ).toEqual(12345)
      })
    })
    it('returns Nan if from analysis file path is not parsable', () => {
      return fs
        .createFile(path.join(protocolsDir, 'not_a_number.json'))
        .then(() => {
          expect(
            getUnixTimeFromAnalysisPath(
              path.join(protocolsDir, 'not_a_number.json')
            )
          ).toEqual(NaN)
        })
    })
  })
})
