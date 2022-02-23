// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'
import Electron from 'electron'
import uuid from 'uuid/v4'
import { when } from 'jest-when'

import {
  readProtocolsDirectory,
  parseProtocolDirs,
  addProtocolFile,
  removeProtocolById,
  PROTOCOL_DIRECTORY_NAME,
  PROTOCOL_DIRECTORY_PATH,
} from '../file-system'

jest.mock('uuid/v4')
jest.mock('electron')

const trashItem = Electron.shell.trashItem as jest.MockedFunction<
  typeof Electron.shell.trashItem
>
const mockUuid = uuid as jest.MockedFunction<typeof uuid>

describe('protocol storage directory utilities', () => {
  let protocolsDir: string
  const tempDirs: string[] = []
  const makeEmptyDir = (): string => {
    const dir: string = tempy.directory()
    tempDirs.push(dir)
    return dir
  }
  beforeEach(() => {
    protocolsDir = makeEmptyDir()
  })

  afterAll(() => {
    jest.resetAllMocks()
    return Promise.all(tempDirs.map(d => fs.remove(d)))
  })

  describe('PROTOCOL DIRECTORY', () => {
    it('constructs PROTOCOL_DIRECTORY_PATH', () => {
      return expect(PROTOCOL_DIRECTORY_PATH).toEqual(
        `__mock-app-path__/${PROTOCOL_DIRECTORY_NAME}`
      )
    })
  })

  describe('readProtocolsDirectory', () => {
    it('resolves empty array for empty directory', () => {
      return expect(readProtocolsDirectory(protocolsDir)).resolves.toEqual([])
    })

    it('rejects if directory is not found', () => {
      return expect(
        readProtocolsDirectory('__not_a_directory__')
      ).rejects.toThrow(/no such file/)
    })

    it('returns paths to *.json files in directory', () => {
      const firstProtocolDirName = 'protocol_item_1'
      const secondProtocolDirName = 'protocol_item_2'
      return Promise.all([
        fs.emptyDir(path.join(protocolsDir, firstProtocolDirName)),
        fs.emptyDir(path.join(protocolsDir, secondProtocolDirName)),
      ]).then(() => {
        return expect(readProtocolsDirectory(protocolsDir)).resolves.toEqual([
          path.join(protocolsDir, firstProtocolDirName),
          path.join(protocolsDir, secondProtocolDirName),
        ])
      })
    })
  })

  describe('parseProtocolDirs', () => {
    it('reads and parses directories', () => {
      const protocolsDir = makeEmptyDir()

      const firstProtocolDirName = 'protocol_item_1'
      const secondProtocolDirName = 'protocol_item_2'

      const firstDirPath = path.join(protocolsDir, firstProtocolDirName)
      const secondDirPath = path.join(protocolsDir, secondProtocolDirName)

      return Promise.all([
        fs.emptyDir(path.join(protocolsDir, firstProtocolDirName)),
        fs.emptyDir(path.join(protocolsDir, secondProtocolDirName)),
      ]).then(() => {
        return expect(
          parseProtocolDirs([firstDirPath, secondDirPath])
        ).resolves.toEqual([
          {
            dirPath: firstDirPath,
            data: [],
            modified: expect.any(Number),
          },
          {
            dirPath: secondDirPath,
            data: [],
            modified: expect.any(Number),
          },
        ])
      })
    })
  })

  describe('addProtocolFile', () => {
    it('writes a protocol file to a new directory', () => {
      let count = 0
      when(mockUuid)
        .calledWith()
        .mockImplementation(() => {
          const nextId = `${count}abc123`
          count = count + 1
          return nextId
        })
      const sourceDir = makeEmptyDir()
      const destDir = makeEmptyDir()
      const sourceName = path.join(sourceDir, 'source.py')
      const expectedName = path.join(destDir, '0abc123')

      return fs
        .writeFile(sourceName, 'file contents')
        .then(() => addProtocolFile(sourceName, destDir))
        .then(() => readProtocolsDirectory(destDir))
        .then(dirPaths => parseProtocolDirs(dirPaths))
        .then(dirs => {
          expect(dirs).toEqual([
            {
              dirPath: expectedName,
              data: [path.join(expectedName, 'source.py')],
              modified: expect.any(Number),
            },
          ])
        })
    })
  })

  describe('remove protocol dir', () => {
    it('calls Electron.shell.trashItem', () => {
      const protocolsDir = makeEmptyDir()
      const protocolId = 'def456'
      const setup = fs.mkdir(path.join(protocolsDir, protocolId))

      trashItem.mockResolvedValue()

      return setup
        .then(() => removeProtocolById('def456', protocolsDir))
        .then(() => {
          expect(Electron.shell.trashItem).toHaveBeenCalledWith(
            path.join(protocolsDir, 'def456')
          )
        })
    })

    it('deletes the file if Electron fails to trash it', () => {
      const protocolsDir = makeEmptyDir()
      const protocolId = 'def456'
      const setup = fs.mkdir(path.join(protocolsDir, protocolId))

      trashItem.mockRejectedValue(Error('something went wrong'))

      return setup
        .then(() => removeProtocolById('def456', protocolsDir))
        .then(() => readProtocolsDirectory(protocolsDir))
        .then(files => expect(files).toEqual([]))
    })
  })
})
