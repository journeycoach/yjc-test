export default {
  name: 'bookmark',
  title: 'Bookmark',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'The name of the link (e.g., "Calendly").'
    },
    {
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({
        scheme: ['http', 'https']
      }),
      description: 'The web address.'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Coaching Tools', value: 'coaching' },
          { title: 'Business & Management', value: 'business' },
          { title: 'Communication & Social', value: 'communication' },
          { title: 'Personal', value: 'personal' },
          { title: 'Other', value: 'other' }
        ]
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'other',
      description: 'Which category does this link belong to?'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Optional details about this link.'
    }
  ]
}
