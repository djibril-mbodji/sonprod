function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CC-${timestamp}-${random}`;
}

function calculateItemPrice(product, quantity, customerType) {
  const isWholesale =
    customerType === 'WHOLESALE' && quantity >= product.minWholesaleQty;
  const unitPrice = isWholesale
    ? Number(product.wholesalePrice)
    : Number(product.retailPrice);
  return { unitPrice, total: unitPrice * quantity };
}

function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

module.exports = { generateOrderNumber, calculateItemPrice, paginate };
