// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'
import Electron from 'electron'
import uuid from 'uuid/v4'
import { when } from 'jest-when'

import {
  readDirectoriesWithinDirectory,
  readFilesWithinDirectory,
  parseProtocolDirs,
  addProtocolFile,
  removeProtocolByKey,
  PROTOCOLS_DIRECTORY_NAME,
  PROTOCOLS_DIRECTORY_PATH,
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
    it('constructs PROTOCOLS_DIRECTORY_PATH', () => {
      return expect(PROTOCOLS_DIRECTORY_PATH).toEqual(
        `__mock-app-path__/${PROTOCOLS_DIRECTORY_NAME}`
      )
    })
  })

  describe('readDirectoriesWithinDirectory', () => {
    it('resolves empty array for empty directory', () => {
      return expect(
        readDirectoriesWithinDirectory(protocolsDir)
      ).resolves.toEqual([])
    })

    it('rejects if directory is not found', () => {
      return expect(
        readDirectoriesWithinDirectory('__not_a_directory__')
      ).rejects.toThrow(/no such file/)
    })

    it('returns paths to all directories in directory', () => {
      const firstProtocolDirName = 'protocol_item_1'
      const secondProtocolDirName = 'protocol_item_2'
      return Promise.all([
        fs.emptyDir(path.join(protocolsDir, firstProtocolDirName)),
        fs.emptyDir(path.join(protocolsDir, secondProtocolDirName)),
      ]).then(() => {
        return expect(
          readDirectoriesWithinDirectory(protocolsDir)
        ).resolves.toEqual([
          path.join(protocolsDir, firstProtocolDirName),
          path.join(protocolsDir, secondProtocolDirName),
        ])
      })
    })
  })

  describe('readFilesWithinDirectory', () => {
    it('resolves empty array for empty directory', () => {
      return expect(readFilesWithinDirectory(protocolsDir)).resolves.toEqual([])
    })

    it('rejects if directory is not found', () => {
      return expect(
        readFilesWithinDirectory('__not_a_directory__')
      ).rejects.toThrow(/no such file/)
    })

    it('returns paths to all files in directory', () => {
      const firstFileName = 'protocol_item_1.py'
      const secondFileName = 'protocol_item_2.py'
      return Promise.all([
        fs.createFile(path.join(protocolsDir, firstFileName)),
        fs.createFile(path.join(protocolsDir, secondFileName)),
      ]).then(() => {
        return expect(readFilesWithinDirectory(protocolsDir)).resolves.toEqual([
          path.join(protocolsDir, firstFileName),
          path.join(protocolsDir, secondFileName),
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
      ]).then(() => {
        return expect(
          parseProtocolDirs([firstDirPath, secondDirPath])
        ).resolves.toEqual([
          {
            dirPath: firstDirPath,
            modified: expect.any(Number),
            srcFilePaths: [path.join(firstDirPath, 'src', 'main.py')],
            analysisFilePaths: [
              path.join(firstDirPath, 'analysis', 'fake_timestamp0.json'),
            ],
          },
          {
            dirPath: secondDirPath,
            modified: expect.any(Number),
            srcFilePaths: [path.join(secondDirPath, 'src', 'main.json')],
            analysisFilePaths: [
              path.join(secondDirPath, 'analysis', 'fake_timestamp1.json'),
            ],
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
      const expectedProtocolDirPath = path.join(destDir, '0abc123')

      return fs
        .writeFile(sourceName, 'file contents')
        .then(() => addProtocolFile(sourceName, destDir))
        .then(() => readDirectoriesWithinDirectory(destDir))
        .then(dirPaths => parseProtocolDirs(dirPaths))
        .then(dirs => {
          expect(dirs).toEqual([
            {
              dirPath: expectedProtocolDirPath,
              srcFilePaths: [
                path.join(expectedProtocolDirPath, 'src', 'source.py'),
              ],
              analysisFilePaths: [expect.any(String)],
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
        .then(() => removeProtocolByKey('def456', protocolsDir))
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
        .then(() => removeProtocolByKey('def456', protocolsDir))
        .then(() => readDirectoriesWithinDirectory(protocolsDir))
        .then(files => expect(files).toEqual([]))
    })
  })
})
