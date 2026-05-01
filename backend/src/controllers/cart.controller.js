const prisma = require('../utils/prisma');
const { calculateItemPrice } = require('../utils/helpers');

async function getCart(req, res) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const cartItems = items.map((item) => {
      const { unitPrice, total } = calculateItemPrice(item.product, item.quantity, req.user.customerType);
      return { ...item, unitPrice, total };
    });

    const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

    res.json({ items: cartItems, total: cartTotal, itemCount: cartItems.length });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

async function addToCart(req, res) {
  try {
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${product.stock}` });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity },
      create: { userId: req.user.id, productId, quantity },
      include: { product: true },
    });

    res.json(item);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
}

async function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;

    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { product: true },
    });

    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    if (quantity > item.product.stock) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${item.product.stock}` });
    }

    const updated = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity },
      include: { product: true },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update cart item error:', err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
}

async function removeFromCart(req, res) {
  try {
    await prisma.cartItem.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
}

async function clearCart(req, res) {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
