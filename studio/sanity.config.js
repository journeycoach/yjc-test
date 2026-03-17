import { QuickLinks } from './plugins/QuickLinks'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'yjc-content',

  projectId: '9ksnhows',
  dataset: 'production',
  basePath: '/admin',

  tools: (prev) => {
    return [
      ...(prev || []),
      {
        name: 'quick-links',
        title: 'Command Center',
        component: QuickLinks,
      },
      
      plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
