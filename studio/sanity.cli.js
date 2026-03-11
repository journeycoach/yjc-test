import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9973sk2c',
    dataset: 'production'
  },
  project: {
    basePath: '/admin'
  },
  vite: (config) => {
    return {
      ...config,
      base: '/admin/'
    }
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  }
})
