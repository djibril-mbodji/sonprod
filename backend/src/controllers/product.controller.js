const prisma = require('../utils/prisma');
const { paginate } = require('../utils/helpers');

async function listProducts(req, res) {
  try {
    const { page, limit, category, search, active } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {};
    if (category) where.categoryId = category;
    if (active !== undefined) where.isActive = active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function getProduct(req, res) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, categoryId, retailPrice, wholesalePrice, unit, stock, minWholesaleQty, imageUrl } = req.body;
    const product = await prisma.product.create({
      data: { name, description, categoryId, retailPrice, wholesalePrice, unit: unit || 'kg', stock: stock || 0, minWholesaleQty: minWholesaleQty || 10, imageUrl },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { name, description, categoryId, retailPrice, wholesalePrice, unit, stock, minWholesaleQty, imageUrl, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, categoryId, retailPrice, wholesalePrice, unit, stock, minWholesaleQty, imageUrl, isActive },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json(product);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
