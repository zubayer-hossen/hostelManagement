import { z } from 'zod';
import { DOCUMENT_TYPES } from '../models/ResidentDocument.js';
import { objectId, phoneSchema, paginationQuery, booleanQuery } from './common.js';

const t = (max) => z.string().trim().max(max);
const contact = z.object({ name: t(80), phone: phoneSchema, relation: t(40) }).partial();
const url = t(1000).refine((v) => v === '' || /^(https?:\/\/|\/)\S*$/i.test(v), 'Must be an http(s) URL');

/** What a resident may edit about themselves. Status, room, rent and verification fields are NOT here. */
export const updateResidentBody = z
  .object({
    photoUrl: url,
    fatherName: t(80), motherName: t(80),
    dateOfBirth: z.coerce.date().refine((d) => d >= new Date('1930-01-01') && d <= new Date(), 'Enter a valid date of birth').nullable(),
    phone: phoneSchema,
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]),
    emergencyContact: contact, guardian: contact,
    permanentAddress: t(400), presentAddress: t(400), nationality: t(60),
    occupation: t(80), institution: t(120), department: t(80),
    bloodGroup: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    expectedLeavingDate: z.coerce.date().nullable(),
    notes: t(1000),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export const listResidentsQuery = paginationQuery.extend({
  status: z.enum(['pending', 'verified', 'rejected', 'suspended', 'archived']).optional(),
  hostelType: z.enum(['boys', 'girls']).optional(),
  room: objectId.optional(),
  moveOut: z.enum(['requested', 'approved', 'rejected', 'completed']).optional(),
  hasDue: booleanQuery.optional(),
  search: t(80).optional(),
});

export const verifyBody = z.object({ status: z.enum(['pending', 'verified', 'rejected', 'suspended', 'archived']), note: t(500).optional() });
export const transferBody = z.object({ bedId: objectId, reason: t(300).min(3, 'Please give a reason') });
export const moveOutRequestBody = z.object({ date: z.coerce.date().refine((d) => d >= new Date(Date.now() - 864e5), 'Date cannot be in the past'), reason: t(500).optional() });
export const moveOutDecisionBody = z.object({ approve: z.boolean(), note: t(500).optional() });

export const documentUploadBody = z.object({ type: z.enum(DOCUMENT_TYPES), label: t(80).default('') });
export const documentParams = z.object({ docId: objectId });
export const residentDocumentParams = z.object({ id: objectId, docId: objectId });
export const documentReviewBody = z.object({ status: z.enum(['verified', 'rejected']), note: t(300).optional() });
