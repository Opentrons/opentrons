// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'

import { PROTOCOLS_DIRECTORY_NAME } from '../file-system'
import {
  fetchProtocols,
  getUnixTimeFromAnalysisPath,
  getParsedAnalysisFromPath,
} from '../'

describe('protocol storage directory utilities', () => {
  let protocolsDir: string
  let mockAnalysisFilePath: string
  let mockDispatch: () => void

  beforeEach(() => {
    mockAnalysisFilePath = tempy.file({ extension: 'json' })
    protocolsDir = path.join('__mock-app-path__', PROTOCOLS_DIRECTORY_NAME)
    mockDispatch = jest.fn()
  })

  afterEach(() => {
    return Promise.all([fs.rm(mockAnalysisFilePath, { force: true })])
  })
  afterAll(() => {
    jest.resetAllMocks()
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

  describe('getParsedAnalysis', () => {
    it('parses json if available', () => {
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
