// @flow
// tests for labware directory utilities

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'
import { readLabwareDirectory, parseLabwareFiles } from '../definitions'

describe('labware directory utilities', () => {
  const tempDirs: Array<string> = []
  const makeEmptyDir = (): string => {
    const dir: string = tempy.directory()
    tempDirs.push(dir)
    return dir
  }

  afterAll(() => {
    return Promise.all(tempDirs.map(d => fs.remove(d)))
  })

  describe('readLabwareDirectory', () => {
    test('resolved empty array for empty directory', () => {
      const dir = makeEmptyDir()
      return expect(readLabwareDirectory(dir)).resolves.toEqual([])
    })

    test('rejects if directory is not found', () => {
      return expect(
        readLabwareDirectory('__not_a_directory__')
      ).rejects.toThrow(/no such file/)
    })

    test('returns paths to JSON files in directory', () => {
      const dir = makeEmptyDir()

      return Promise.all([
        fs.writeJson(path.join(dir, 'a.json'), { name: 'a' }),
        fs.writeJson(path.join(dir, 'b.json'), { name: 'b' }),
        fs.writeJson(path.join(dir, 'c.json'), { name: 'c' }),
      ]).then(() => {
        return expect(readLabwareDirectory(dir)).resolves.toEqual([
          path.join(dir, 'a.json'),
          path.join(dir, 'b.json'),
          path.join(dir, 'c.json'),
        ])
      })
    })

    test('returns paths to nested JSON files in directory', () => {
      const dir = makeEmptyDir()
      const nested = path.join(dir, 'nested')

      return fs
        .ensureDir(nested)
        .then(() => {
          return Promise.all([
            fs.writeJson(path.join(nested, 'a.json'), { name: 'a' }),
            fs.writeJson(path.join(dir, 'b.json'), { name: 'b' }),
            fs.writeJson(path.join(dir, 'c.json'), { name: 'c' }),
          ])
        })
        .then(() => {
          return expect(readLabwareDirectory(dir)).resolves.toEqual([
            path.join(dir, 'b.json'),
            path.join(dir, 'c.json'),
            path.join(nested, 'a.json'),
          ])
        })
    })
  })

  describe('parseLabwareFiles', () => {
    test('reads and parses JSON files', () => {
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
        return expect(parseLabwareFiles(files)).resolves.toEqual([
          {
            filename: files[0],
            data: { name: 'a' },
            created: expect.any(Number),
          },
          {
            filename: files[1],
            data: { name: 'b' },
            created: expect.any(Number),
          },
          {
            filename: files[2],
            data: { name: 'c' },
            created: expect.any(Number),
          },
        ])
      })
    })

    test('surfaces parse errors as null data', () => {
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
        return expect(parseLabwareFiles(files)).resolves.toEqual([
          {
            filename: files[0],
            data: { name: 'a' },
            created: expect.any(Number),
          },
          { filename: files[1], data: null, created: expect.any(Number) },
          {
            filename: files[2],
            data: { name: 'c' },
            created: expect.any(Number),
          },
        ])
      })
    })
  })
})
