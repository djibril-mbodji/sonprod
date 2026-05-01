const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const customerPassword = await bcrypt.hash('customer123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@capitalchicken.com' },
    update: {},
    create: {
      email: 'admin@capitalchicken.com',
      phone: '+221770000001',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Capital',
      role: 'ADMIN',
    },
  });

  const retailCustomer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      phone: '+221770000002',
      password: customerPassword,
      firstName: 'Fatou',
      lastName: 'Diallo',
      role: 'CUSTOMER',
      customerType: 'RETAIL',
      address: '123 Rue de la Paix',
      city: 'Dakar',
    },
  });

  const wholesaleCustomer = await prisma.user.upsert({
    where: { email: 'wholesale@example.com' },
    update: {},
    create: {
      email: 'wholesale@example.com',
      phone: '+221770000003',
      password: customerPassword,
      firstName: 'Moussa',
      lastName: 'Ndiaye',
      role: 'CUSTOMER',
      customerType: 'WHOLESALE',
      address: '456 Avenue Cheikh Anta Diop',
      city: 'Dakar',
    },
  });

  const deliveryAgent = await prisma.user.upsert({
    where: { email: 'delivery@capitalchicken.com' },
    update: {},
    create: {
      email: 'delivery@capitalchicken.com',
      phone: '+221770000004',
      password: customerPassword,
      firstName: 'Ibrahima',
      lastName: 'Sow',
      role: 'DELIVERY_AGENT',
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Live Chicken' },
      update: {},
      create: { name: 'Live Chicken', description: 'Fresh live chickens ready for purchase' },
    }),
    prisma.category.upsert({
      where: { name: 'Frozen Chicken' },
      update: {},
      create: { name: 'Frozen Chicken', description: 'Frozen whole chickens and parts' },
    }),
    prisma.category.upsert({
      where: { name: 'Cut Chicken' },
      update: {},
      create: { name: 'Cut Chicken', description: 'Pre-cut chicken parts and portions' },
    }),
    prisma.category.upsert({
      where: { name: 'Processed' },
      update: {},
      create: { name: 'Processed', description: 'Marinated, seasoned, and ready-to-cook chicken products' },
    }),
  ]);

  const products = [
    { name: 'Whole Live Chicken', description: 'Healthy farm-raised live chicken', categoryId: categories[0].id, retailPrice: 3500, wholesalePrice: 3000, unit: 'piece', stock: 200, minWholesaleQty: 20 },
    { name: 'Live Rooster', description: 'Large farm-raised rooster', categoryId: categories[0].id, retailPrice: 5000, wholesalePrice: 4200, unit: 'piece', stock: 80, minWholesaleQty: 10 },
    { name: 'Frozen Whole Chicken', description: 'Frozen whole chicken, cleaned and ready', categoryId: categories[1].id, retailPrice: 3200, wholesalePrice: 2700, unit: 'kg', stock: 500, minWholesaleQty: 50 },
    { name: 'Frozen Chicken Drumsticks', description: 'Pack of frozen chicken drumsticks', categoryId: categories[1].id, retailPrice: 2500, wholesalePrice: 2000, unit: 'kg', stock: 300, minWholesaleQty: 30 },
    { name: 'Chicken Breast', description: 'Fresh boneless chicken breast', categoryId: categories[2].id, retailPrice: 4000, wholesalePrice: 3400, unit: 'kg', stock: 150, minWholesaleQty: 20 },
    { name: 'Chicken Wings', description: 'Fresh chicken wings', categoryId: categories[2].id, retailPrice: 2800, wholesalePrice: 2300, unit: 'kg', stock: 200, minWholesaleQty: 25 },
    { name: 'Chicken Thighs', description: 'Fresh boneless chicken thighs', categoryId: categories[2].id, retailPrice: 3500, wholesalePrice: 2900, unit: 'kg', stock: 180, minWholesaleQty: 20 },
    { name: 'Marinated Chicken', description: 'Pre-marinated whole chicken with spices', categoryId: categories[3].id, retailPrice: 4500, wholesalePrice: 3800, unit: 'kg', stock: 100, minWholesaleQty: 15 },
    { name: 'Chicken Sausages', description: 'Homemade chicken sausages', categoryId: categories[3].id, retailPrice: 3000, wholesalePrice: 2500, unit: 'kg', stock: 120, minWholesaleQty: 20 },
    { name: 'Chicken Kebab Pack', description: 'Ready-to-grill chicken kebab skewers', categoryId: categories[3].id, retailPrice: 5500, wholesalePrice: 4800, unit: 'pack', stock: 60, minWholesaleQty: 10 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.name },
      update: {},
      create: product,
    }).catch(() => {
      return prisma.product.create({ data: product });
    });
  }

  console.log('Seeding complete!');
  console.log(`Admin: ${admin.email}`);
  console.log(`Retail customer: ${retailCustomer.email}`);
  console.log(`Wholesale customer: ${wholesaleCustomer.email}`);
  console.log(`Delivery agent: ${deliveryAgent.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
