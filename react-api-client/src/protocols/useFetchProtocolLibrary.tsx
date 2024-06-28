import * as React from 'react'

import axios from 'axios'

export const GET_PROTOCOLS = `
  query GetProtocols($limit: Int, $isFeatured: Boolean, $shuffle: Boolean) {
    getProtocols(limit: $limit, isFeatured: $isFeatured, shuffle: $shuffle) {
      slug
      name
      summary(renderToHTML: true)
      isActive
      description
      isFeatured
      hasRtp
      hasLp
      modules {
        name
      }
      verification {
        opentrons
        community
        manufacturer
        education
      }
    }
  }
`
export const GET_PROTOCOL_BY_SLUG = `
query GetProtocolBySlug($slug: String!) {
  getProtocolBySlug(slug: $slug) {
    analyses {
      result
      number
    }
    protocolUuid
    creatingUserUuid
    principalOrganizationUuid
    robotUuid
    categoryUuid
    protocolText
    isActive
    status
    name
    slug
    filename
    type
    isPrivate
    isFeatured
    hasRtp
    hasLp
    protocolLibraryParameters
    customLabware
    authors {
      name
      email
    }
    category {
      parentCategoryUuid
      categoryUuid
      name
      icon
      sequence
      featured
      parent {
        parentCategoryUuid
        categoryUuid
        name
        icon
        sequence
        featured
      }
    }
    labware {
      name
      category
      imageSmallUrl
      imageLargeUrl
      buyUrl
      quantity
    }
    modules {
      name
      model
      type
      quantity
      imageSmallUrl
      imageLargeUrl
      buyUrl
    }
    pipettes {
      name
      channelType
      quantity
      imageSmallUrl
      imageLargeUrl
      buyUrl
    }
    verification {
      community
      manufacturer
      opentrons
      education
    }
   
    summary(renderToHTML: true)
    description(renderToHTML: true)
    tipsForSuccess(renderToHTML: true)
    supportingData(renderToHTML: true)
    runTimeParametersDesc(renderToHTML: true)
    robot {
      name
      type
      imageSmallUrl
      imageLargeUrl
      buyUrl
    }
    organizations {
      organizationUuid
      name
      id
    }
  }
}

`
export async function fetchProtocols(
  isFeatured: boolean,
  shuffle: boolean,
  limit?: number
) {
  try {
    const response = await axios.post(
      'https://library.opentrons.com/api/graphql',
      {
        query: GET_PROTOCOLS,
        variables: { isFeatured, shuffle, limit },
      }
    )
    return response.data.data.getProtocols
  } catch (error: any) {
    throw new Error(
      error.response.data.errors
        ? error.response.data.errors[0].message
        : 'Unknown error'
    )
  }
}

interface ProtocolLibraryFetch {
  protocols: any
  loading: boolean
  error: any
}
export const useFetchProtocolLibrary = (
  isFeatured: boolean,
  shuffle: boolean,
  limit?: number
): ProtocolLibraryFetch => {
  const [protocols, setProtocols] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    async function getProtocols() {
      try {
        const data = await fetchProtocols(
          isFeatured,
          shuffle,
          limit ?? undefined
        )
        setProtocols(data)
      } catch (err) {
        console.log('err', err)
      } finally {
        setLoading(false)
      }
    }
    getProtocols()
  }, [limit, isFeatured, shuffle])

  return { protocols, loading, error }
}

export async function fetchProtocol(slug: string): Promise<any> {
  try {
    const response = await axios.post(
      'https://library.opentrons.com/api/graphql',
      {
        query: GET_PROTOCOL_BY_SLUG,
        variables: { slug },
      }
    )
    return response.data.data.getProtocolBySlug
  } catch (error: any) {
    throw new Error(
      error.response.data.errors
        ? error.response.data.errors[0].message
        : 'Unknown error'
    )
  }
}

interface ProtocolLibraryData {
  protocol: any
  loading: boolean
  error: any
}
export const useFetchProtocolFromLibrary = (
  slug: string
): ProtocolLibraryData => {
  const [protocol, setProtocol] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    async function getProtocol() {
      try {
        const data = await fetchProtocol(slug)
        setProtocol(data)
      } catch (err) {
        console.log('err', err)
      } finally {
        setLoading(false)
      }
    }
    getProtocol()
  }, [slug])

  return { protocol, loading, error }
}
