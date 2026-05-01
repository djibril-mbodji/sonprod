const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty(),
    body('categoryId').isUUID(),
    body('retailPrice').isFloat({ min: 0 }),
    body('wholesalePrice').isFloat({ min: 0 }),
  ],
  validate,
  createProduct
);

router.put('/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

module.exports = router;
