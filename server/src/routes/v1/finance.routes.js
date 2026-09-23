import { Router } from 'express';
import * as c from '../../controllers/financeController.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { PERMISSIONS as P } from '../../constants/permissions.js';
import { idParams } from '../../validations/common.js';
import * as v from '../../validations/finance.validation.js';

const staff = requirePermission(P.MANAGE_PAYMENTS);

export const duesRouter = Router();
duesRouter.use(authenticate);
duesRouter.get('/mine', c.myDues);                                   // a resident sees only their own dues
duesRouter.get('/summary', staff, c.summary);
duesRouter.get('/', staff, validate({ query: v.listDuesQuery }), c.listDues);
duesRouter.post('/generate', staff, validate({ body: v.generateRentBody }), c.generate);
duesRouter.post('/', staff, validate({ body: v.createDueBody }), c.createDue);
duesRouter.post('/:id/void', staff, validate({ params: idParams, body: v.voidBody }), c.voidDue);

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);
paymentsRouter.get('/mine', c.myPayments);
paymentsRouter.get('/', staff, validate({ query: v.listPaymentsQuery }), c.listPayments);
paymentsRouter.post('/', staff, validate({ body: v.recordPaymentBody }), c.record);
paymentsRouter.post('/:id/void', staff, validate({ params: idParams, body: v.voidBody }), c.voidPayment);
