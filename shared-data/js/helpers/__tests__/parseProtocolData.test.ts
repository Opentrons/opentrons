import { vi, beforeEach, afterEach, it, expect, describe } from 'vitest'
// json protocol file validator tests
import fixtureV1JsonProtocol from '../../../protocol/fixtures/1/simple.json'
import fixtureV3JsonProtocol from '../../../protocol/fixtures/3/simple.json'
import fixtureV4JsonProtocol from '../../../protocol/fixtures/4/simpleV4.json'
import fixtureV5JsonProtocol from '../../../protocol/fixtures/5/simpleV5.json'
import {
  fileExtensionIsPython,
  fileExtensionIsJson,
  fileExtensionIsZip,
  validateJsonProtocolFileContents,
  parseProtocolData,
} from '../parseProtocolData'
import type { Mock } from 'vitest'

describe('validateJsonProtocolFileContents', () => {
  let handleError: Mock 
  // beforeAll

  beforeEach(() => {
    handleError = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`should validate schemaV3 JSON protocol`, () => {
    const data = validateJsonProtocolFileContents(
      JSON.stringify(fixtureV3JsonProtocol)
    )
    expect(data).toStrictEqual(fixtureV3JsonProtocol)
  })

  it(`should validate schemaV4 JSON protocol`, () => {
    const data = validateJsonProtocolFileContents(
      JSON.stringify(fixtureV4JsonProtocol)
    )
    expect(data).toStrictEqual(fixtureV4JsonProtocol)
  })

  it(`should validate schemaV5 JSON protocol`, () => {
    const data = validateJsonProtocolFileContents(
      JSON.stringify(fixtureV5JsonProtocol)
    )
    expect(data).toStrictEqual(fixtureV5JsonProtocol)
  })

  it('should call handleError with INVALID_FILE_TYPE if empty json', () => {
    validateJsonProtocolFileContents('[]', handleError)
    expect(handleError).toBeCalledWith('INVALID_JSON_FILE', {
      rawError: expect.any(Error),
    })
  })

  it('should call handleError with INVALID_JSON_FILE if json does not validate against schema', () => {
    validateJsonProtocolFileContents(
      JSON.stringify(fixtureV1JsonProtocol),
      handleError
    )
    expect(handleError).toBeCalledWith('INVALID_JSON_FILE', {
      schemaErrors: expect.any(Array),
    })
  })

  it('should call handleError with INVALID_JSON_FILE if json is not parseable', () => {
    const parseSpy = vi.spyOn(JSON, 'parse')
    parseSpy.mockImplementation(() => {
      throw new Error('not parseable as JSON')
    })
    validateJsonProtocolFileContents('[]', handleError)
    expect(handleError).toBeCalledWith('INVALID_JSON_FILE', {
      rawError: expect.any(Error),
    })
    parseSpy.mockRestore()
  })
})

describe('file extension validators', () => {
  describe('fileExtensionIsPython', () => {
    it(`should return true if file name ends in .py`, () => {
      expect(fileExtensionIsPython('foo.py')).toBe(true)
    })
    it(`should return false if file name ends in anything other than .py`, () => {
      expect(fileExtensionIsPython('foo.json')).toBe(false)
      expect(fileExtensionIsPython('foo.zip')).toBe(false)
      expect(fileExtensionIsPython('foo.pie')).toBe(false)
    })
  })
  describe('fileExtensionIsJson', () => {
    it(`should return true if file name ends in .json`, () => {
      expect(fileExtensionIsJson('foo.json')).toBe(true)
    })
    it(`should return false if file name ends in anything other than .json`, () => {
      expect(fileExtensionIsJson('foo.py')).toBe(false)
      expect(fileExtensionIsJson('foo.zip')).toBe(false)
      expect(fileExtensionIsJson('foo.pie')).toBe(false)
    })
  })
  describe('fileExtensionIsZip', () => {
    it(`should return true if file name ends in .zip`, () => {
      expect(fileExtensionIsZip('foo.zip')).toBe(true)
    })
    it(`should return false if file name ends in anything other than .zip`, () => {
      expect(fileExtensionIsZip('foo.py')).toBe(false)
      expect(fileExtensionIsZip('foo.json')).toBe(false)
      expect(fileExtensionIsZip('foo.pie')).toBe(false)
    })
  })
  describe('fileIsBinary', () => {
    it(`should return true if file name ends in .zip`, () => {
      expect(fileExtensionIsZip('foo.zip')).toBe(true)
    })
    it(`should return false if file name ends in anything other than .zip`, () => {
      expect(fileExtensionIsZip('foo.py')).toBe(false)
      expect(fileExtensionIsZip('foo.json')).toBe(false)
      expect(fileExtensionIsZip('foo.pie')).toBe(false)
    })
  })
})

describe('parseProtocolData', () => {
  let handleError: Mock
  beforeEach(() => {
    handleError = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it(`should return null if not JSON and metadata not given`, () => {
    const contents = 'from math import sqrt'
    const pythonFile = new File([contents], 'foo.py')
    expect(parseProtocolData(pythonFile, contents)).toBe(null)
  })
  it(`should return metadata if not JSON and metadata is given`, () => {
    const contents = 'from math import sqrt'
    const pythonFile = new File([contents], 'foo.py')
    const metadata = {
      'protocol-name': 'Foo Extraction',
      author: 'Dr. Bar Baz',
    } as any
    expect(
      parseProtocolData(pythonFile, contents, handleError, metadata)
    ).toStrictEqual({ metadata })
  })
  it(`should return JSON protocol file if valid json protocol given`, () => {
    const contents = JSON.stringify(fixtureV5JsonProtocol)
    const jsonFile = new File([contents], 'valid.json')
    expect(parseProtocolData(jsonFile, contents, handleError)).toStrictEqual(
      fixtureV5JsonProtocol
    )
  })
  it(`should call handleError if given JSON protocol not valid`, () => {
    const contents = JSON.stringify(fixtureV1JsonProtocol)
    const jsonFile = new File([contents], 'invalid.json')
    expect(parseProtocolData(jsonFile, contents, handleError)).toBe(null)
    expect(handleError).toHaveBeenCalled()
  })
  it(`should call handleError if given invalid file extension`, () => {
    const contents = JSON.stringify(fixtureV1JsonProtocol)
    const jsonFile = new File([contents], 'invalid.foobar')
    expect(parseProtocolData(jsonFile, contents, handleError)).toBe(null)
    expect(handleError).toHaveBeenCalledWith('INVALID_FILE_TYPE')
  })
})
