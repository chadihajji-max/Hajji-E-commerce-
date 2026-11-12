import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit3, X, Users, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { Customer } from '../../types';
import { DbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'US',
  });

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DbService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingCustomer(null);
    setFormData({
      id: 'cust_' + Date.now().toString(36),
      full_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'US',
      total_spent: 0,
      orders_count: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({ ...cust });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer record?')) {
      await DbService.deleteCustomer(id);
      showToast('Customer deleted successfully', 'info');
      loadData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      showToast('Please provide full name and email', 'error');
      return;
    }

    const payload: Customer = {
      id: editingCustomer?.id || formData.id || 'cust_' + Date.now().toString(36),
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || '',
      address: formData.address?.trim() || 'Standard Address',
      city: formData.city?.trim() || 'General City',
      country: formData.country || 'US',
      total_spent: editingCustomer?.total_spent ?? 0,
      orders_count: editingCustomer?.orders_count ?? 0,
      created_at: editingCustomer?.created_at || new Date().toISOString(),
    };

    await DbService.saveCustomer(payload);
    showToast('Customer record saved successfully', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const filtered = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-neutral-900"
          />
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer Table */}
      {loading ? (
        <LoadingState variant="table" count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No customers registered yet"
          description="Customer records will automatically populate as orders are placed."
          actionLabel="Add Customer"
          onAction={openNewModal}
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 space-y-0.5">
                      <div className="text-[11px] text-neutral-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span>{c.email}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{c.city}, {c.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                      {c.orders_count} orders
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tabular-nums text-neutral-900">
                      ${c.total_spent.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-600 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Leila Mansour"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="leila@example.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Building, Street"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Dubai"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Country Code</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                    placeholder="AE, US, SA"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-semibold cursor-pointer shadow-2xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
