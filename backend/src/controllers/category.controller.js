const prisma = require('../utils/prisma');

async function listCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function getCategory(req, res) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: { where: { isActive: true } } },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description, imageUrl } = req.body;
    const category = await prisma.category.create({
      data: { name, description, imageUrl },
    });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, description, imageUrl, isActive } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, imageUrl, isActive },
    });
    res.json(category);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Category deactivated' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
