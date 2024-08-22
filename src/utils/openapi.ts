import info from '@/../package.json'
import type { ApiReferenceOptions } from '@scalar/hono-api-reference'
import { lowerCase, startCase, upperFirst } from 'lodash'

export const reference: ApiReferenceOptions = {
  spec: {
    url: '/specification'
  },
  defaultHttpClient: {
    targetKey: 'node',
    clientKey: 'axios'
  },
  layout: 'modern',
  hideDownloadButton: true,
  darkMode: true,
  metaData: {
    title: startCase(lowerCase(info.name))
  },
  theme: 'bluePlanet',
  defaultOpenAllTags: false,
  tagsSorter: 'alpha'
}

export const specification = {
  openapi: '3.0.0',
  info: {
    title: startCase(lowerCase(info.name)),
    version: info.version,
    description: info.description,
    license: {
      name: info.license
    }
  }
}
