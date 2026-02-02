import { describe, expect, it } from 'vitest'

import {
  assertAllowedImportUrl,
  getImportProtocolQueryParams,
  stripImportProtocolQueryParams,
} from '../importFromUrl'

describe('importFromUrl utilities', () => {
  it('infers filename from signed URL path when name param is not provided', () => {
    const signedUrl =
      'https://s3.us-east-2.amazonaws.com/ot-dj-dev/media/user_uploads/1/abc/v1/Bead_clean_fixed.py?X-Amz-Signature=abc'
    window.history.replaceState(
      null,
      document.title,
      `/?src=${encodeURIComponent(signedUrl)}`
    )

    expect(getImportProtocolQueryParams()).toEqual({
      signedUrl,
      filename: 'Bead_clean_fixed.py',
      fallbackType: undefined,
    })
  })

  it('infers filename and content-type from signed URL response-content-* params', () => {
    const signedUrl =
      'https://s3.us-east-2.amazonaws.com/ot-dj-dev/media/user_uploads/1/abc/v1/ignored.py?response-content-disposition=attachment%3B%20filename%3D%22Bead_clean_fixed.py%22&response-content-type=text%2Fx-python-script&X-Amz-Signature=abc'
    window.history.replaceState(
      null,
      document.title,
      `/?src=${encodeURIComponent(signedUrl)}`
    )

    expect(getImportProtocolQueryParams()).toEqual({
      signedUrl,
      filename: 'Bead_clean_fixed.py',
      fallbackType: 'text/x-python-script',
    })
  })

  it('handles signed URLs with unescaped quotes in response-content-disposition', () => {
    const signedUrlWithRawQuotes =
      'https://s3.us-east-2.amazonaws.com/ot-dj-dev/media/user_uploads/1/abc/v1/ignored.py?response-content-disposition=attachment%3B%20filename%3D"Bead_clean_fixed.py"&response-content-type=text%2Fx-python-script&X-Amz-Signature=abc'
    window.history.replaceState(
      null,
      document.title,
      `/?src=${encodeURIComponent(signedUrlWithRawQuotes)}`
    )

    expect(getImportProtocolQueryParams()).toEqual({
      // Signed URL is preserved exactly as passed.
      signedUrl: signedUrlWithRawQuotes,
      filename: 'Bead_clean_fixed.py',
      fallbackType: 'text/x-python-script',
    })
  })

  it('parses src/name from window.location.search', () => {
    const signedUrl = 'https://s3.us-east-2.amazonaws.com/my-bucket/protocol.json?X-Amz-Signature=abc'
    window.history.replaceState(
      null,
      document.title,
      `/?src=${encodeURIComponent(signedUrl)}&name=my.json`
    )

    expect(getImportProtocolQueryParams()).toEqual({
      signedUrl,
      filename: 'my.json',
      fallbackType: undefined,
    })
  })

  it('reconstructs src when a presigned URL is not URL-encoded (search params)', () => {
    // Simulates a caller passing `src=https://...?...&X-Amz-Signature=...` without
    // encoding it. The outer URL parser splits `&X-Amz-*` into top-level params.
    window.history.replaceState(
      null,
      document.title,
      '/?src=https://s3.us-east-2.amazonaws.com/my-bucket/Bead_clean_fixed.py?response-content-disposition=attachment%3B%20filename%3D%22Bead_clean_fixed.py%22&response-content-type=text%2Fx-python-script&X-Amz-Signature=abc'
    )

    expect(getImportProtocolQueryParams()).toEqual({
      signedUrl:
        'https://s3.us-east-2.amazonaws.com/my-bucket/Bead_clean_fixed.py?response-content-disposition=attachment%3B%20filename%3D%22Bead_clean_fixed.py%22&response-content-type=text%2Fx-python-script&X-Amz-Signature=abc',
      filename: 'Bead_clean_fixed.py',
      fallbackType: 'text/x-python-script',
    })
  })

  it('parses src/name from hash query (HashRouter-style URLs)', () => {
    const signedUrl = 'https://s3.us-east-2.amazonaws.com/my-bucket/protocol.json?X-Amz-Signature=abc'
    window.history.replaceState(
      null,
      document.title,
      `/#/overview?src=${encodeURIComponent(signedUrl)}&name=my.json`
    )

    expect(getImportProtocolQueryParams()).toEqual({
      signedUrl,
      filename: 'my.json',
      fallbackType: undefined,
    })
  })

  it('strips import params from search', () => {
    const signedUrl = 'https://s3.us-east-2.amazonaws.com/my-bucket/protocol.json?X-Amz-Signature=abc'
    window.history.replaceState(
      null,
      document.title,
      `/?src=${encodeURIComponent(signedUrl)}&name=my.json&type=application%2Fjson`
    )

    stripImportProtocolQueryParams()

    expect(window.location.search).toBe('')
  })

  it('allows same-origin and aws/cloudfront domains, blocks others', () => {
    expect(() => {
      assertAllowedImportUrl('http://localhost/foo.json')
    }).not.toThrow()
    expect(() => {
      assertAllowedImportUrl('https://s3.us-east-2.amazonaws.com/my-bucket/foo.json')
    }).not.toThrow()
    expect(() => {
      assertAllowedImportUrl('https://my-bucket.s3.us-east-2.amazonaws.com/foo.json')
    }).not.toThrow()
    expect(() => {
      assertAllowedImportUrl('https://d111111abcdef8.cloudfront.net/foo.json')
    }).not.toThrow()

    expect(() => {
      assertAllowedImportUrl('https://example.com/foo.json')
    }).toThrow(/Disallowed import host/)
  })
})
