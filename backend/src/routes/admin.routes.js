const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getDashboard, listCustomers, getCustomer, updateCustomer, getSalesAnalytics } = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomer);
router.put('/customers/:id', updateCustomer);
router.get('/analytics/sales', getSalesAnalytics);

module.exports = router;
