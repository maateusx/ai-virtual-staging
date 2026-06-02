import { StagingParameter } from '../models/StagingParameter.js';

// Admin CRUD for the configuration screen. Exposes prompt_fragment and
// inactive entries (unlike the public /v1/staging/config endpoint).
//
// NOTE: spec §8 assumes an authenticated admin session already exists.
// Auth middleware is intentionally out of scope for this MVP — mount it here.

export async function adminRoutes(app) {
  // List all parameters (full detail).
  app.get('/v1/admin/parameters', async () => {
    const params = await StagingParameter.find().sort({ order: 1 });
    return { parameters: params.map((p) => p.toAdmin()) };
  });

  // Create a parameter.
  app.post('/v1/admin/parameters', async (request, reply) => {
    const { label, type, order, active, options } = request.body ?? {};
    if (!label) return reply.code(422).send({ error: 'label is required' });

    const param = await StagingParameter.create({
      label,
      type: type ?? 'single_select',
      order: order ?? 0,
      active: active ?? true,
      options: Array.isArray(options) ? options : [],
    });
    return reply.code(201).send(param.toAdmin());
  });

  // Update a parameter (label/type/order/active). Options handled separately.
  app.patch('/v1/admin/parameters/:id', async (request, reply) => {
    const param = await StagingParameter.findById(request.params.id);
    if (!param) return reply.code(404).send({ error: 'parameter not found' });

    const { label, type, order, active } = request.body ?? {};
    if (label !== undefined) param.label = label;
    if (type !== undefined) param.type = type;
    if (order !== undefined) param.order = order;
    if (active !== undefined) param.active = active;
    await param.save();
    return param.toAdmin();
  });

  // Delete a parameter.
  app.delete('/v1/admin/parameters/:id', async (request, reply) => {
    const res = await StagingParameter.findByIdAndDelete(request.params.id);
    if (!res) return reply.code(404).send({ error: 'parameter not found' });
    return reply.code(204).send();
  });

  // --- Options (subdocuments) ----------------------------------------------

  // Add an option to a parameter.
  app.post('/v1/admin/parameters/:id/options', async (request, reply) => {
    const param = await StagingParameter.findById(request.params.id);
    if (!param) return reply.code(404).send({ error: 'parameter not found' });

    const { label, prompt_fragment, order, active } = request.body ?? {};
    if (!label) return reply.code(422).send({ error: 'label is required' });
    if (!prompt_fragment) {
      return reply.code(422).send({ error: 'prompt_fragment is required' });
    }

    param.options.push({
      label,
      prompt_fragment,
      order: order ?? param.options.length,
      active: active ?? true,
    });
    await param.save();
    return reply.code(201).send(param.toAdmin());
  });

  // Update an option.
  app.patch('/v1/admin/parameters/:id/options/:optionId', async (request, reply) => {
    const param = await StagingParameter.findById(request.params.id);
    if (!param) return reply.code(404).send({ error: 'parameter not found' });

    const option = param.options.id(request.params.optionId);
    if (!option) return reply.code(404).send({ error: 'option not found' });

    const { label, prompt_fragment, order, active } = request.body ?? {};
    if (label !== undefined) option.label = label;
    if (prompt_fragment !== undefined) option.prompt_fragment = prompt_fragment;
    if (order !== undefined) option.order = order;
    if (active !== undefined) option.active = active;
    await param.save();
    return param.toAdmin();
  });

  // Delete an option.
  app.delete('/v1/admin/parameters/:id/options/:optionId', async (request, reply) => {
    const param = await StagingParameter.findById(request.params.id);
    if (!param) return reply.code(404).send({ error: 'parameter not found' });

    const option = param.options.id(request.params.optionId);
    if (!option) return reply.code(404).send({ error: 'option not found' });

    option.deleteOne();
    await param.save();
    return param.toAdmin();
  });
}
