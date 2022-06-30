// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'

import { PROTOCOLS_DIRECTORY_NAME } from '../file-system'
import {
  fetchProtocols,
  getUnixTimeFromAnalysisPath,
  getParsedAnalysisFromPath,
} from '../'

describe('protocol storage directory utilities', () => {
  let protocolsDir: string
  let mockDispatch: () => void
  beforeEach(() => {
    protocolsDir = path.join('__mock-app-path__', PROTOCOLS_DIRECTORY_NAME)
    mockDispatch = jest.fn()
  })

  afterEach(() => {
    fs.remove(protocolsDir)
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
        .writeJson(path.join(protocolsDir, 'fake_timestamp0.json'), {
          someKey: 1,
        })
        .then(() => {
          expect(
            getParsedAnalysisFromPath(
              path.join(protocolsDir, 'fake_timestamp0.json')
            )
          ).toEqual({ someKey: 1 })
        })
    })
    it('returns failed analysis if parsing error', () => {
      expect(
        getParsedAnalysisFromPath(
          path.join(protocolsDir, 'fake_timestamp1.json')
        )
      ).toEqual({
        commands: [],
        config: {},
        createdAt: expect.any(String),
        errors: [
          {
            createdAt: expect.any(String),
            detail:
              "__mock-app-path__/protocols/fake_timestamp1.json: ENOENT: no such file or directory, open '__mock-app-path__/protocols/fake_timestamp1.json'",
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
      return fs
        .writeJson(path.join(protocolsDir, '12345.json'), {
          someKey: 1,
        })
        .then(() => {
          expect(
            getUnixTimeFromAnalysisPath(path.join(protocolsDir, '12345.json'))
          ).toEqual(12345)
        })
    })
    it('returns Nan if from analysis file path is not parsable', () => {
      return fs
        .writeJson(path.join(protocolsDir, 'not_a_number.json'), {
          someKey: 1,
        })
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
