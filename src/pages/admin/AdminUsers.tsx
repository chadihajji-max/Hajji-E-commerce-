import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit3, X, Shield, ShieldCheck, ShieldAlert, UserCog, Check, Ban } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { DbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: '',
    email: '',
    phone: '',
    role: 'customer',
  });

  const { user: currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DbService.getAllProfiles();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingUser(null);
    setFormData({
      id: 'usr_' + Date.now().toString(36),
      full_name: '',
      email: '',
      phone: '',
      role: 'customer',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormData({ ...u });
    setIsModalOpen(true);
  };

  const handleDelete = async (u: UserProfile) => {
    if (u.id === currentUser?.id) {
      showToast('You cannot delete your own active administrator account.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to delete user ${u.full_name}?`)) {
      await DbService.deleteUser(u.id);
      showToast('User deleted successfully', 'info');
      loadData();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      showToast('Please provide full name and email', 'error');
      return;
    }

    const payload: UserProfile = {
      id: editingUser?.id || formData.id || 'usr_' + Date.now().toString(36),
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || '',
      role: formData.role || 'customer',
      created_at: editingUser?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await DbService.saveUser(payload);
    showToast('User record saved successfully', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const filtered = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
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
            placeholder="Search users or roles..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-neutral-900"
          />
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingState variant="table" count={3} />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email & Auth Identity</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">RBAC Permissions</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{u.full_name}</span>
                            {isCurrent && (
                              <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-bold">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-neutral-900 text-white'
                            : u.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-neutral-500">
                        {u.role === 'admin' 
                          ? 'Full Unrestricted Operations (manage_all)'
                          : u.role === 'manager'
                          ? 'Catalog & Orders Management'
                          : 'Public Storefront & Own Orders'}
                      </td>
                      <td className="px-4 py-3 text-neutral-400 text-[11px] font-mono">
                        {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-1.5 text-neutral-500 hover:text-rose-600 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                {editingUser ? 'Edit User Credentials & Role' : 'Create New System User'}
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
                  placeholder="e.g. Tariq Mansour"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tariq@aura-commerce.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Assigned Role (RBAC)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5 font-semibold"
                >
                  <option value="customer">Customer (Storefront Consumer)</option>
                  <option value="manager">Manager (Catalog & Orders Ops)</option>
                  <option value="admin">Administrator (Full Unrestricted Access)</option>
                </select>
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
