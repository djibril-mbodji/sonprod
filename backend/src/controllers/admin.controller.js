const prisma = require('../utils/prisma');
const { paginate } = require('../utils/helpers');

async function getDashboard(req, res) {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      ordersByStatus,
      salesData,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, customerType: true } },
        },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.order.aggregate({
        _sum: { total: true },
        _avg: { total: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 10 } },
        orderBy: { stock: 'asc' },
        take: 10,
        include: { category: { select: { name: true } } },
      }),
    ]);

    const statusCounts = {};
    for (const s of ordersByStatus) {
      statusCounts[s.status] = s._count.id;
    }

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        totalRevenue: salesData._sum.total || 0,
        averageOrderValue: salesData._avg.total || 0,
      },
      ordersByStatus: statusCounts,
      recentOrders,
      lowStockProducts,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

async function listCustomers(req, res) {
  try {
    const { page, limit, search, type } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = { role: 'CUSTOMER' };
    if (type) where.customerType = type;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          customerType: true, address: true, city: true, isActive: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: customers,
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

async function getCustomer(req, res) {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        customerType: true, address: true, city: true, isActive: true, createdAt: true,
        orders: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        },
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
}

async function updateCustomer(req, res) {
  try {
    const { customerType, isActive } = req.body;
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data: { customerType, isActive },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        customerType: true, isActive: true,
      },
    });
    res.json(customer);
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

async function getSalesAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: 'CANCELLED' },
      },
      select: { total: true, createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailySales = {};
    for (const order of orders) {
      const day = order.createdAt.toISOString().split('T')[0];
      if (!dailySales[day]) dailySales[day] = { date: day, revenue: 0, orders: 0 };
      dailySales[day].revenue += Number(order.total);
      dailySales[day].orders += 1;
    }

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));
    const topProductsWithNames = topProducts.map((p) => ({
      productId: p.productId,
      name: productMap[p.productId] || 'Unknown',
      totalQuantity: p._sum.quantity,
      totalRevenue: p._sum.total,
    }));

    res.json({
      dailySales: Object.values(dailySales),
      topProducts: topProductsWithNames,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
      totalOrders: orders.length,
    });
  } catch (err) {
    console.error('Sales analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}

module.exports = { getDashboard, listCustomers, getCustomer, updateCustomer, getSalesAnalytics };
