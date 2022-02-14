// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'
import Electron from 'electron'
import { when } from 'jest-when'

import {
  readProtocolDirectory,
  parseProtocolFiles,
  addProtocolFile,
  removeProtocolFile,
  PROTOCOL_DIRECTORY_NAME,
  PROTOCOL_DIRECTORY_PATH,
} from '../file-system'

jest.mock('electron')

const trashItem = Electron.shell.trashItem as jest.MockedFunction<
  typeof Electron.shell.trashItem
>
const mockGetPath = Electron.app.getPath as jest.MockedFunction<
  typeof Electron.app.getPath
>

describe('protocol storage directory utilities', () => {
  let protocolsDir: string
  const tempDirs: string[] = []
  const makeEmptyDir = (): string => {
    const dir: string = tempy.directory()
    tempDirs.push(dir)
    return dir
  }
  const mockAppDataDirPath = '/FakeAppData'
  beforeEach(() => {
    when(mockGetPath).calledWith('appData').mockReturnValue(mockAppDataDirPath)
    protocolsDir = makeEmptyDir()
  })

  afterAll(() => {
    jest.resetAllMocks()
    return Promise.all(tempDirs.map(d => fs.remove(d)))
  })

  describe('PROTOCOL DIRECTORY', () => {
    it('constructs PROTOCOL_DIRECTORY_PATH', () => {
      return expect(PROTOCOL_DIRECTORY_PATH).toEqual(
        `${mockAppDataDirPath}/${PROTOCOL_DIRECTORY_NAME}`
      )
    })
  })

  describe('readProtocolDirectory', () => {
    it('resolves empty array for empty directory', () => {
      return expect(readProtocolDirectory(protocolsDir)).resolves.toEqual([])
    })

    it('rejects if directory is not found', () => {
      return expect(
        readProtocolDirectory('__not_a_directory__')
      ).rejects.toThrow(/no such file/)
    })

    it('returns paths to *.json files in directory', () => {
      const firstProtocolItemDirName = 'protocol_item_1'
      const secondProtocolItemDirName = 'protocol_item_1'
      return Promise.all([
        fs.emptyDir(path.join(protocolsDir, firstProtocolItemDirName)),
        fs.emptyDir(path.join(protocolsDir, secondProtocolItemDirName)),
      ]).then(() => {
        return expect(readProtocolDirectory(protocolsDir)).resolves.toEqual([
          path.join(protocolsDir, firstProtocolItemDirName),
          path.join(protocolsDir, secondProtocolItemDirName),
        ])
      })
    })
  })

  describe('parseProtocolFiles', () => {
    it('reads and parses JSON files', () => {
      const dir = makeEmptyDir()
      const files = [
        path.join(dir, 'a.json'),
        path.join(dir, 'b.json'),
        path.join(dir, 'c.json'),
      ]

      return Promise.all([
        fs.writeJson(files[0], { name: 'a' }),
        fs.writeJson(files[1], { name: 'b' }),
        fs.writeJson(files[2], { name: 'c' }),
      ]).then(() => {
        return expect(parseProtocolFiles(files)).resolves.toEqual([
          {
            filename: files[0],
            data: { name: 'a' },
            modified: expect.any(Number),
          },
          {
            filename: files[1],
            data: { name: 'b' },
            modified: expect.any(Number),
          },
          {
            filename: files[2],
            data: { name: 'c' },
            modified: expect.any(Number),
          },
        ])
      })
    })

    it('surfaces parse errors as null data', () => {
      const dir = makeEmptyDir()
      const files = [
        path.join(dir, 'a.json'),
        path.join(dir, 'b.json'),
        path.join(dir, 'c.json'),
      ]

      return Promise.all([
        fs.writeJson(files[0], { name: 'a' }),
        fs.writeFile(files[1], `this isn't JSON!!!`),
        fs.writeJson(files[2], { name: 'c' }),
      ]).then(() => {
        return expect(parseProtocolFiles(files)).resolves.toEqual([
          {
            filename: files[0],
            data: { name: 'a' },
            modified: expect.any(Number),
          },
          { filename: files[1], data: null, modified: expect.any(Number) },
          {
            filename: files[2],
            data: { name: 'c' },
            modified: expect.any(Number),
          },
        ])
      })
    })
  })

  describe('addProtocolFile', () => {
    it('writes a labware file to the directory', () => {
      const sourceDir = makeEmptyDir()
      const destDir = makeEmptyDir()
      const sourceName = path.join(sourceDir, 'source.json')
      const expectedName = path.join(destDir, 'source.json')

      return fs
        .writeJson(sourceName, { name: 'a' })
        .then(() => addProtocolFile(sourceName, destDir))
        .then(() => readProtocolDirectory(destDir))
        .then(parseProtocolFiles)
        .then(files => {
          expect(files).toEqual([
            {
              filename: expectedName,
              data: { name: 'a' },
              modified: expect.any(Number),
            },
          ])
        })
    })

    it('increments filename to avoid collisions', () => {
      const sourceDir = makeEmptyDir()
      const destDir = makeEmptyDir()
      const sourceName = path.join(sourceDir, 'source.json')
      const collision1 = path.join(destDir, 'source.json')
      const collision2 = path.join(destDir, 'source1.json')
      const expectedName = path.join(destDir, 'source2.json')

      const setup = Promise.all([
        fs.writeJson(sourceName, { name: 'a' }),
        fs.writeJson(collision1, { name: 'b' }),
        fs.writeJson(collision2, { name: 'c' }),
      ])

      return setup
        .then(() => addProtocolFile(sourceName, destDir))
        .then(() => readProtocolDirectory(destDir))
        .then(parseProtocolFiles)
        .then(files => {
          expect(files).toContainEqual({
            filename: expectedName,
            data: { name: 'a' },
            modified: expect.any(Number),
          })
        })
    })
  })

  describe('remove labware file', () => {
    it('calls Electron.shell.trashItem', () => {
      const dir = makeEmptyDir()
      const filename = path.join(dir, 'foo.json')

      trashItem.mockResolvedValue()

      return removeProtocolFile(filename).then(() => {
        expect(Electron.shell.trashItem).toHaveBeenCalledWith(filename)
      })
    })

    it('deletes the file if Electron fails to trash it', () => {
      const dir = makeEmptyDir()
      const filename = path.join(dir, 'foo.json')
      const setup = fs.writeJson(filename, { name: 'a' })

      trashItem.mockRejectedValue(Error('something went wrong'))

      return setup
        .then(() => removeProtocolFile(filename))
        .then(() => readProtocolDirectory(dir))
        .then(files => expect(files).toEqual([]))
    })
  })
})
