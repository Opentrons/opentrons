/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useImportProtocolFromUrl } from '../useImportProtocolFromUrl'

import type { ThunkDispatch } from '/protocol-designer/types'
import type * as ReactRouterDom from 'react-router-dom'
import type * as ReactRedux from 'react-redux'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouterDom>(
    'react-router-dom'
  )
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockDispatch: ThunkDispatch<any> = vi.fn() as any

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof ReactRedux>('react-redux')
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  }
})

describe('useImportProtocolFromUrl', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // reset URL between tests
    window.history.replaceState(null, document.title, '/')

    // default fetch mock
    vi.stubGlobal('fetch', vi.fn())
  })

  it('does nothing when no src query param is present', async () => {
    renderHook(() => {
      useImportProtocolFromUrl()
    })

    // Let effects flush.
    await Promise.resolve()
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('imports and navigates to /overview on success (search params)', async () => {
    const signedUrl =
      'https://s3.us-east-2.amazonaws.com/my-bucket/protocol.json?X-Amz-Signature=abc'
    const href = `/?src=${encodeURIComponent(signedUrl)}`
    window.history.replaceState(null, document.title, href)

    const response = new Response('{"metadata": {}}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    vi.mocked(fetch).mockResolvedValue(response as any)

    renderHook(() => {
      useImportProtocolFromUrl()
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(signedUrl, { method: 'GET' })
      expect(mockDispatch).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/overview')
    })

    // query params should be stripped to prevent re-import on refresh
    expect(window.location.search).not.toContain('src=')
    expect(window.location.search).not.toContain('name=')
  })

  it('dispatches a FAILED_TO_IMPORT_FROM_URL message when host is disallowed', async () => {
    const signedUrl = 'https://evil.example.com/protocol.json'
    const href = `/?src=${encodeURIComponent(signedUrl)}`
    window.history.replaceState(null, document.title, href)

    renderHook(() => {
      useImportProtocolFromUrl()
    })

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'FILE_UPLOAD_MESSAGE',
          payload: expect.objectContaining({
            isError: true,
            errorType: 'FAILED_TO_IMPORT_FROM_URL',
          }),
        })
      )
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('dispatches a FAILED_TO_IMPORT_FROM_URL message when fetch fails', async () => {
    const signedUrl =
      'https://s3.us-east-2.amazonaws.com/my-bucket/protocol.json?X-Amz-Signature=abc'
    const href = `/?src=${encodeURIComponent(signedUrl)}`
    window.history.replaceState(null, document.title, href)

    const response = new Response('nope', { status: 403, statusText: 'Forbidden' })
    vi.mocked(fetch).mockResolvedValue(response as any)

    renderHook(() => {
      useImportProtocolFromUrl()
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'FILE_UPLOAD_MESSAGE',
          payload: expect.objectContaining({
            isError: true,
            errorType: 'FAILED_TO_IMPORT_FROM_URL',
            errorMessage: expect.stringContaining('Failed to fetch file: 403'),
          }),
        })
      )
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
