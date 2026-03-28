import { BookmarkDashboard } from './plugins/BookmarkDashboard'
import { ReturnToSite } from './plugins/ReturnToSite'
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
  tools: [
    {
      name: 'bookmark-dashboard',
      title: 'Dashboard',
      component: BookmarkDashboard,
    },
    {
      name: 'return-to-site',
      title: '← Back to Website',
      component: ReturnToSite,
    }
  ],

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
