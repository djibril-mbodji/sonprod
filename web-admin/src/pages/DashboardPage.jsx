import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  ShoppingCart, Users, Package, DollarSign,
  AlertTriangle, ArrowRight, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.dashboard(),
      adminAPI.salesAnalytics({ days: 30 }),
    ]).then(([dashRes, analyticsRes]) => {
      setDashboard(dashRes.data);
      setAnalytics(analyticsRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) return null;

  const stats = [
    { label: 'Total Revenue', value: `${Number(dashboard.stats.totalRevenue).toLocaleString()} CFA`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Total Orders', value: dashboard.stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Customers', value: dashboard.stats.totalCustomers, icon: Users, color: 'bg-purple-500' },
    { label: 'Products', value: dashboard.stats.totalProducts, icon: Package, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to Capital Chicken Admin</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview (Last 30 Days)</h2>
          {analytics?.dailySales?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} CFA`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No sales data yet
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-3">
            {Object.entries(dashboard.ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                  {status.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(dashboard.ordersByStatus || {}).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {dashboard.recentOrders?.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.user?.firstName} {order.user?.lastName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{Number(order.total).toLocaleString()} CFA</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
            {(!dashboard.recentOrders || dashboard.recentOrders.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-3">
            {dashboard.lowStockProducts?.map((product) => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-600">{product.stock} left</span>
                </div>
              </div>
            ))}
            {(!dashboard.lowStockProducts || dashboard.lowStockProducts.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">All products well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
