// tests for labware directory utilities

import path from 'path'
import Electron from 'electron'
import fs from 'fs-extra'
import tempy from 'tempy'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { analyzeProtocolSource } from '../../protocol-analysis'
import {
  addProtocolFile,
  NOT_OT2_PROTOCOLS_DIRECTORY_NAME,
  parseProtocolDirs,
  PROTOCOLS_DIRECTORY_NAME,
  PROTOCOLS_DIRECTORY_PATH,
  readDirectoriesWithinDirectory,
  readFilesWithinDirectory,
  removeProtocolByKey,
  shouldMigrateToNotOt2Directory,
  viewProtocolSourceFolder,
} from '../file-system'

vi.mock('uuid', () => ({
  v4: vi.fn(),
}))
vi.mock('electron')
vi.mock('electron-store')
vi.mock('../../protocol-analysis')
vi.mock('../../log')

const trashItem = Electron.shell.trashItem

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
    vi.mocked(analyzeProtocolSource).mockReturnValue(Promise.resolve())
  })

  afterAll((): any => {
    vi.resetAllMocks()
    return Promise.all(tempDirs.map(d => fs.remove(d)))
  })

  describe('PROTOCOL DIRECTORY', () => {
    it('constructs PROTOCOLS_DIRECTORY_PATH', () => {
      return expect(PROTOCOLS_DIRECTORY_PATH).toEqual(
        path.join('__mock-app-path__', PROTOCOLS_DIRECTORY_NAME)
      )
    })

    it('uses protocols-9.1-plus as NOT_OT2_PROTOCOLS_DIRECTORY_NAME', () => {
      expect(NOT_OT2_PROTOCOLS_DIRECTORY_NAME).toBe('protocols-9.1-plus')
    })
  })

  describe('shouldMigrateToNotOt2Directory', () => {
    it('returns true when analysis has robotType OT-3 Standard', async () => {
      const protocolDir = makeEmptyDir()
      await fs.mkdir(path.join(protocolDir, 'src'))
      await fs.mkdir(path.join(protocolDir, 'analysis'))
      await fs.writeFile(path.join(protocolDir, 'src', 'main.py'), '')
      await fs.writeJson(
        path.join(protocolDir, 'analysis', '1234567890.json'),
        { robotType: 'OT-3 Standard' }
      )
      expect(await shouldMigrateToNotOt2Directory(protocolDir)).toBe(true)
    })

    it('returns false when analysis has robotType OT-2 Standard', async () => {
      const protocolDir = makeEmptyDir()
      await fs.mkdir(path.join(protocolDir, 'src'))
      await fs.mkdir(path.join(protocolDir, 'analysis'))
      await fs.writeFile(path.join(protocolDir, 'src', 'main.py'), '')
      await fs.writeJson(
        path.join(protocolDir, 'analysis', '1234567890.json'),
        { robotType: 'OT-2 Standard' }
      )
      expect(await shouldMigrateToNotOt2Directory(protocolDir)).toBe(false)
    })

    it('returns true when analysis directory is missing (migrate by default)', async () => {
      const protocolDir = makeEmptyDir()
      await fs.mkdir(path.join(protocolDir, 'src'))
      await fs.writeFile(path.join(protocolDir, 'src', 'main.py'), '')
      expect(await shouldMigrateToNotOt2Directory(protocolDir)).toBe(true)
    })

    it('returns true when analysis has no robotType (migrate by default)', async () => {
      const protocolDir = makeEmptyDir()
      await fs.mkdir(path.join(protocolDir, 'src'))
      await fs.mkdir(path.join(protocolDir, 'analysis'))
      await fs.writeFile(path.join(protocolDir, 'src', 'main.py'), '')
      await fs.writeJson(
        path.join(protocolDir, 'analysis', '1234567890.json'),
        { metadata: {} }
      )
      expect(await shouldMigrateToNotOt2Directory(protocolDir)).toBe(true)
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
    it('reads and parses directories', async () => {
      const protocolsDir = makeEmptyDir()
      const firstProtocolDirName = 'protocol_item_1'
      const secondProtocolDirName = 'protocol_item_2'
      const firstDirPath = path.join(protocolsDir, firstProtocolDirName)
      const secondDirPath = path.join(protocolsDir, secondProtocolDirName)

      await fs.emptyDir(path.join(protocolsDir, firstProtocolDirName))
      await fs.emptyDir(path.join(protocolsDir, firstProtocolDirName, 'src'))
      await fs.emptyDir(
        path.join(protocolsDir, firstProtocolDirName, 'analysis')
      )
      await fs.createFile(
        path.join(protocolsDir, firstProtocolDirName, 'src', 'main.py')
      )
      await fs.createFile(
        path.join(
          protocolsDir,
          firstProtocolDirName,
          'analysis',
          'fake_timestamp0.json'
        )
      )

      await fs.emptyDir(path.join(protocolsDir, secondProtocolDirName))
      await fs.emptyDir(path.join(protocolsDir, secondProtocolDirName, 'src'))
      await fs.emptyDir(
        path.join(protocolsDir, secondProtocolDirName, 'analysis')
      )
      await fs.createFile(
        path.join(protocolsDir, secondProtocolDirName, 'src', 'main.json')
      )
      await fs.createFile(
        path.join(
          protocolsDir,
          secondProtocolDirName,
          'analysis',
          'fake_timestamp1.json'
        )
      )

      const result = await parseProtocolDirs([firstDirPath, secondDirPath])

      expect(result).toEqual([
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

  describe('addProtocolFile', () => {
    it('writes a protocol file to a new directory', async () => {
      const { v4: uuid } = await import('uuid')
      vi.mocked(uuid).mockImplementation((() => '0abc123') as typeof uuid)
      const sourceDir = makeEmptyDir()
      const destDir = makeEmptyDir()
      const sourceName = path.join(sourceDir, 'source.py')
      const expectedProtocolDirPath = path.join(destDir, '0abc123')

      await fs.writeFile(sourceName, 'file contents')
      await addProtocolFile(sourceName, destDir)
      const dirPaths = await readDirectoriesWithinDirectory(destDir)
      const dirs = await parseProtocolDirs(dirPaths)
      expect(dirs).toEqual([
        {
          dirPath: expectedProtocolDirPath,
          srcFilePaths: [
            path.join(expectedProtocolDirPath, 'src', 'source.py'),
          ],
          analysisFilePaths: [],
          modified: expect.any(Number),
        },
      ])
    })
  })

  describe('viewProtocolSourceFolder', () => {
    beforeEach(() => {
      vi.mocked(Electron.shell.showItemInFolder).mockClear()
      vi.mocked(Electron.shell.openPath).mockClear()
    })

    it('highlights the protocol source file in the file manager', async () => {
      const protocolsDir = makeEmptyDir()
      const srcDirPath = path.join(protocolsDir, 'abc123', 'src')
      await fs.emptyDir(srcDirPath)
      await fs.createFile(path.join(srcDirPath, 'serialDilution.py'))

      await viewProtocolSourceFolder('abc123', protocolsDir)

      expect(Electron.shell.showItemInFolder).toHaveBeenCalledWith(
        path.join(srcDirPath, 'serialDilution.py')
      )
      expect(Electron.shell.openPath).not.toHaveBeenCalled()
    })

    it('falls back to opening the src folder when it holds no files', async () => {
      const protocolsDir = makeEmptyDir()
      const srcDirPath = path.join(protocolsDir, 'abc123', 'src')
      await fs.emptyDir(srcDirPath)

      await viewProtocolSourceFolder('abc123', protocolsDir)

      expect(Electron.shell.openPath).toHaveBeenCalledWith(srcDirPath)
      expect(Electron.shell.showItemInFolder).not.toHaveBeenCalled()
    })
  })

  describe('remove protocol dir', () => {
    it('calls Electron.shell.trashItem', () => {
      const protocolsDir = makeEmptyDir()
      const protocolId = 'def456'
      const setup = fs.mkdir(path.join(protocolsDir, protocolId))

      vi.mocked(trashItem).mockResolvedValue()

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

      vi.mocked(trashItem).mockRejectedValue(Error('something went wrong'))

      return setup
        .then(() => removeProtocolByKey('def456', protocolsDir))
        .then(() => readDirectoriesWithinDirectory(protocolsDir))
        .then(files => expect(files).toEqual([]))
    })
  })
})
