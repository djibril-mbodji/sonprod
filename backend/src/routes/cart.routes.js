const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart.controller');

const router = Router();

router.use(authenticate);

router.get('/', getCart);

router.post(
  '/',
  [
    body('productId').isUUID(),
    body('quantity').isInt({ min: 1 }),
  ],
  validate,
  addToCart
);

router.put(
  '/:id',
  [body('quantity').isInt({ min: 1 })],
  validate,
  updateCartItem
);

router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
