import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';
import { buildPagination } from '../utils/response.js';
import { logAudit } from './auditService.js';

/**
 * Generic CRUD for simple CMS resources. Every resource declares:
 *   Model, entity (audit name), searchFields, adminSort, publicFilter(query, now), publicSort
 * Controllers stay thin and identical, so behaviour (validation, auditing, pagination) is consistent.
 */
export function createCrudService({ Model, entity, searchFields = [], adminSort = { createdAt: -1 }, publicFilter, publicSort = { createdAt: -1 } }) {
  const findOrFail = async (id) => {
    const doc = await Model.findById(id);
    if (!doc) throw ApiError.notFound(`${entity} not found`);
    return doc;
  };

  return {
    async publicList(query) {
      const filter = publicFilter(query, new Date());
      return Model.find(filter).sort(publicSort).limit(query.limit || 100);
    },

    async adminList({ page, limit, search, isActive }) {
      const filter = {};
      if (isActive) filter.isActive = isActive === 'true';
      if (search && searchFields.length) {
        const rx = new RegExp(escapeRegex(search), 'i');
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      const [items, total] = await Promise.all([
        Model.find(filter).sort(adminSort).skip((page - 1) * limit).limit(limit),
        Model.countDocuments(filter),
      ]);
      return { items, pagination: buildPagination({ page, limit, total }) };
    },

    getOne: findOrFail,

    async create(req, data) {
      const doc = await Model.create(data);
      await logAudit({ req, action: `${entity.toLowerCase()}.created`, entity, entityId: doc._id });
      return doc;
    },

    async update(req, id, data) {
      const doc = await findOrFail(id);
      doc.set(data);
      await doc.save();
      await logAudit({ req, action: `${entity.toLowerCase()}.updated`, entity, entityId: doc._id, metadata: { fields: Object.keys(data) } });
      return doc;
    },

    async remove(req, id) {
      const doc = await findOrFail(id);
      await doc.deleteOne();
      await logAudit({ req, action: `${entity.toLowerCase()}.deleted`, entity, entityId: doc._id });
    },
  };
}
