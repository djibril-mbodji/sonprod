const prisma = require('../utils/prisma');
const { generateOrderNumber, calculateItemPrice, paginate } = require('../utils/helpers');

async function createOrder(req, res) {
  try {
    const { deliveryAddress, deliveryCity, deliveryPhone, paymentMethod, notes } = req.body;
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    for (const item of cartItems) {
      if (!item.product.isActive) {
        return res.status(400).json({ error: `Product "${item.product.name}" is no longer available` });
      }
      if (item.quantity > item.product.stock) {
        return res.status(400).json({ error: `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}` });
      }
    }

    const orderItems = cartItems.map((item) => {
      const { unitPrice, total } = calculateItemPrice(item.product, item.quantity, req.user.customerType);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const discount = 0;
    const total = subtotal - discount;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          subtotal,
          discount,
          total,
          paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
          deliveryAddress,
          deliveryCity: deliveryCity || null,
          deliveryPhone,
          notes: notes || null,
          items: { create: orderItems },
        },
        include: { items: { include: { product: { select: { id: true, name: true } } } } },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

async function listOrders(req, res) {
  try {
    const { page, limit, status } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);

    const where = {};
    if (req.user.role === 'CUSTOMER') where.userId = req.user.id;
    if (req.user.role === 'DELIVERY_AGENT') where.deliveryAgentId = req.user.id;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, customerType: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
    });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

async function getOrder(req, res) {
  try {
    const where = { id: req.params.id };
    if (req.user.role === 'CUSTOMER') where.userId = req.user.id;

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, customerType: true } },
        items: { include: { product: true } },
        deliveryAgent: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { status, deliveryAgentId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const timestamps = {
      CONFIRMED: 'confirmedAt',
      PROCESSING: 'processingAt',
      OUT_FOR_DELIVERY: 'outForDeliveryAt',
      DELIVERED: 'deliveredAt',
      CANCELLED: 'cancelledAt',
    };

    if (status === 'CANCELLED' && !['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order can only be cancelled when pending or confirmed' });
    }

    if (status !== 'CANCELLED') {
      const currentIdx = statusFlow.indexOf(order.status);
      const newIdx = statusFlow.indexOf(status);
      if (newIdx <= currentIdx) {
        return res.status(400).json({ error: `Cannot change status from ${order.status} to ${status}` });
      }
    }

    const data = { status };
    if (timestamps[status]) data[timestamps[status]] = new Date();
    if (deliveryAgentId) data.deliveryAgentId = deliveryAgentId;
    if (status === 'DELIVERED') data.paymentStatus = 'PAID';

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };
