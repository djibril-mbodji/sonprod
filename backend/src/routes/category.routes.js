const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { listCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');

const router = Router();

router.get('/', listCategories);
router.get('/:id', getCategory);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [body('name').trim().notEmpty()],
  validate,
  createCategory
);

router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

module.exports = router;
