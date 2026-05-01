import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, Eye, X } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await adminAPI.customers(params);
      setCustomers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const viewCustomer = async (id) => {
    try {
      const { data } = await adminAPI.customer(id);
      setSelectedCustomer(data);
    } catch {
      toast.error('Failed to load customer');
    }
  };

  const updateCustomerType = async (id, customerType) => {
    try {
      await adminAPI.updateCustomer(id, { customerType });
      toast.success('Customer type updated');
      fetchCustomers(pagination.page);
      if (selectedCustomer?.id === id) {
        const { data } = await adminAPI.customer(id);
        setSelectedCustomer(data);
      }
    } catch {
      toast.error('Failed to update customer');
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await adminAPI.updateCustomer(id, { isActive: !isActive });
      toast.success(isActive ? 'Customer deactivated' : 'Customer activated');
      fetchCustomers(pagination.page);
    } catch {
      toast.error('Failed to update customer');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">Manage your customer base</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTypeFilter('')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!typeFilter ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          <button onClick={() => setTypeFilter('RETAIL')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'RETAIL' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Retail</button>
          <button onClick={() => setTypeFilter('WHOLESALE')} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'WHOLESALE' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Wholesale</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No customers found</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs text-gray-500">{customer.city || 'No city'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{customer.email}</p>
                    <p className="text-xs text-gray-500">{customer.phone || 'No phone'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={customer.customerType}
                      onChange={(e) => updateCustomerType(customer.id, e.target.value)}
                      className="px-2 py-1 text-xs font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    {customer._count?.orders || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(customer.id, customer.isActive)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${customer.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => viewCustomer(customer.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchCustomers(pagination.page - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <button disabled={pagination.page >= pagination.pages} onClick={() => fetchCustomers(pagination.page + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Type</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.customerType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Address</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.address || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-3">Recent Orders</p>
                {selectedCustomer.orders?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{Number(order.total).toLocaleString()} CFA</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
