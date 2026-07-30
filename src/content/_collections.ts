import { z } from 'astro/zod';

export const collectionConfig = () => ({
  docs: {
    schema: () => ({
      title: z.string(),
      project: z.string().default('Core API'),
      category: z.string().optional(),
      description: z.string().optional()
    })
  }
});
