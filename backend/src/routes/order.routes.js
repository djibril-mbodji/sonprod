const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createOrder, listOrders, getOrder, updateOrderStatus } = require('../controllers/order.controller');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('deliveryAddress').trim().notEmpty(),
    body('deliveryPhone').trim().notEmpty(),
  ],
  validate,
  createOrder
);

router.get('/', listOrders);
router.get('/:id', getOrder);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'DELIVERY_AGENT'),
  [body('status').isIn(['CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])],
  validate,
  updateOrderStatus
);

module.exports = router;
