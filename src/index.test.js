/**
 * @noflow
 */

import React from 'react'
import ActiveStorageProvider from './index'
import { render, screen } from '@testing-library/react'

global.fetch = require('jest-fetch-mock')

jest.mock('DirectUploadProvider', () =>
  jest.fn(props => <div data-component="DirectUploadProvider" {...props} />)
)

const mockCSRFHeader = { 'x-csrf-token': 'qwertyuiop' }
jest.mock('csrfHeader', () => () => mockCSRFHeader)

const endpoint = {
  path: '/users/1',
  model: 'User',
  attribute: 'avatar',
  method: 'PUT',
}
const onSubmit = jest.fn()

const userData = { id: '1', avatar: 'file' }

function renderComponent(props: Object = {}) {
  render(
    <ActiveStorageProvider
      directUploadsPath="direct_uploads/"
      endpoint={endpoint}
      headers={{ 'X-Custom': true }}
      multiple={false}
      onBeforeBlobRequest={jest.fn()}
      onBeforeStorageRequest={jest.fn()}
      onError={jest.fn()}
      onSubmit={onSubmit}
      render={props => <div data-testid="direct-upload-provider" {...props} />}
      {...props}
    />
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  fetch.resetMocks()
})

describe('ActiveStorageProvider', () => {
  beforeEach(() => {
    // renderComponent()
    fetch.mockResponse(JSON.stringify(userData))
  })

  it('renders a DirectUploadProvider', () => {
    renderComponent()
    const element = screen.getByTestId('direct-upload-provider')
    expect(element).toBeInTheDocument()
  })

  it('hits the given endpoint with the signed id of the upload after it has finished', async () => {
    await component.props.onSuccess(['signedId'])
    expect(fetch).toHaveBeenCalledWith(
      endpoint.path,
      expect.objectContaining({
        method: endpoint.method,
        body: JSON.stringify({
          [endpoint.model.toLowerCase()]: { avatar: 'signedId' },
        }),
      })
    )
    expect(onSubmit).toHaveBeenCalledWith(userData)
  })

  it('doesn’t hit the endpoint if handleUpload is called with no files', async () => {
    await component.props.onSuccess([])
    expect(fetch).not.toHaveBeenCalled()
  })

  describe('if custom headers are provided', () => {
    it('merges headers indifferently', async () => {
      const baseCustomHeaders = { 'TEST-HEADER': 'testValue' }
      const customHeaders = {
        ...baseCustomHeaders,
        'X-CSRF-Token': 'testToken',
      }

      component = renderComponent({ headers: customHeaders })
      await component.props.onSuccess(['signedId'])
      expect(fetch).toHaveBeenCalledWith(
        endpoint.path,
        expect.objectContaining({
          method: endpoint.method,
          body: JSON.stringify({
            [endpoint.model.toLowerCase()]: { avatar: 'signedId' },
          }),
          headers: new Headers({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...customHeaders,
          }),
        })
      )

      const newCustomHeaders = {
        ...baseCustomHeaders,
        'x-csrf-token': 'testToken',
      }
      component = renderComponent({ headers: newCustomHeaders })
      await component.props.onSuccess(['signedId'])
      expect(fetch).toHaveBeenCalledWith(
        endpoint.path,
        expect.objectContaining({
          method: endpoint.method,
          body: JSON.stringify({
            [endpoint.model.toLowerCase()]: { avatar: 'signedId' },
          }),
          headers: new Headers({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...customHeaders,
          }),
        })
      )

      component = renderComponent({ headers: baseCustomHeaders })
      await component.props.onSuccess(['signedId'])
      expect(fetch).toHaveBeenCalledWith(
        endpoint.path,
        expect.objectContaining({
          method: endpoint.method,
          body: JSON.stringify({
            [endpoint.model.toLowerCase()]: { avatar: 'signedId' },
          }),
          headers: new Headers({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...baseCustomHeaders,
            ...mockCSRFHeader,
          }),
        })
      )
    })
  })

  describe('if no headers are provided', () => {
    beforeEach(() => {
      component = renderComponent()
    })

    it('adds a CSRF token through the meta tag', async () => {
      await component.props.onSuccess(['signedId'])
      expect(fetch).toHaveBeenCalledWith(
        endpoint.path,
        expect.objectContaining({
          method: endpoint.method,
          body: JSON.stringify({
            [endpoint.model.toLowerCase()]: { avatar: 'signedId' },
          }),
          headers: new Headers({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...mockCSRFHeader,
          }),
        })
      )
    })
  })
})
