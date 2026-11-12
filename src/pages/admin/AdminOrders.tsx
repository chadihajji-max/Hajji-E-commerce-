import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Eye, X, Phone, Mail, MapPin, Truck } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await StorageService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const updated = await StorageService.updateOrderStatus(orderId, newStatus);
    if (updated) {
      showToast(`Order status updated to ${newStatus}`, 'success');
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order # or customer..."
              className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs overflow-x-auto">
            {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === s ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-mono text-neutral-500">
          Total: {filteredOrders.length} orders
        </span>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingState variant="table" count={4} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No customer orders found"
          description="Orders submitted through storefront checkout will automatically register here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total (USD)</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-[11px]">
                      {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-neutral-900 block">{order.customer_name}</span>
                      <span className="text-neutral-400 text-[11px] font-mono">{order.customer_phone}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {order.items.length} items
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tabular-nums text-neutral-900">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] text-neutral-600 font-mono">
                      {order.payment_method}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`text-[11px] font-semibold rounded px-2 py-1 border transition-colors cursor-pointer ${
                          order.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : order.status === 'shipped'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : order.status === 'processing'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="View Order Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Order Details: {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-600">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-900 block">{selectedOrder.customer_name}</span>
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <Mail className="w-3 h-3" />
                    <span>{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <Phone className="w-3 h-3" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-neutral-900 block">Delivery Address:</span>
                  <div className="flex items-start gap-1.5 text-neutral-500 text-[11px]">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{selectedOrder.shipping_address}, {selectedOrder.shipping_city}</span>
                  </div>
                  {selectedOrder.notes && (
                    <p className="text-[10px] text-neutral-400 italic mt-1">
                      Note: "{selectedOrder.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-neutral-900">Order Items:</h4>
                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image_url}
                          alt={item.product.title_en}
                          className="w-10 h-10 object-cover rounded bg-neutral-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h5 className="font-semibold text-neutral-900 line-clamp-1">{item.product.title_en}</h5>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            Qty: {item.quantity} · Size: {item.selectedSize || 'M'} · SKU: {item.product.sku}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Status Update */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Total Paid (USD):</span>
                  <span className="text-lg font-bold font-mono text-neutral-900">
                    ${selectedOrder.total_amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-700">Change Status:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                    className="text-xs bg-white border border-neutral-200 rounded px-3 py-1 font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-neutral-900 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
