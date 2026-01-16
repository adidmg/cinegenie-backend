export const QUERY_JSON_SCHEMA = {
  type: 'object',
  title: 'QueryPlan',
  description:
    'A structured plan for executing a database query, including joins, filters (where clause), and ordering.',

  properties: {
    joins: {
      type: 'array',
      description:
        'An array defining tables to join (relations) and their aliases.',
      items: {
        type: 'object',
        properties: {
          relation: {
            type: 'string',
            description: 'The name of the table to join.',
          },
          alias: {
            type: 'string',
            description: 'The alias for the joined table.',
          },
        },
        required: ['relation', 'alias'],
      },
    },

    where: {
      type: 'array',
      description: 'An array defining WHERE clause conditions.',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description: 'The column field to filter on.',
          },
          operator: {
            type: 'string',
            description: 'The comparison operator (e.g., "=", ">", "LIKE").',
          },
          value: {
            type: ['string', 'number', 'boolean'],
            description: 'The value to compare against.',
          },
          logic: {
            type: 'string',
            enum: ['AND', 'OR'],
            description: 'The logical connector for the next condition.',
          },
        },
        required: ['field', 'operator', 'value', 'logic'],
      },
    },
    order_by: {
      type: 'object',
      description: 'Optional field for specifying the sorting order.',
      properties: {
        field: { type: 'string', description: 'The column field to order by.' },
        direction: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'The sorting direction.',
        },
      },
      required: ['field', 'direction'],
    },
  },
  required: ['joins', 'where'],
};
