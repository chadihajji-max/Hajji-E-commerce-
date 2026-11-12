import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Package, LogOut, Save, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from '../../context/RouterContext';
import { DbService } from '../../services/dbService';
import { Order } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';

export const UserProfileView: React.FC = () => {
  const { user, logout, updateProfile, isStaff } = useAuth();
  const { t, language, isRtl } = useLanguage();
  const { navigate } = useRouter();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      loadUserOrders();
    }
  }, [user]);

  const loadUserOrders = async () => {
    try {
      setLoadingOrders(true);
      const allOrders = await DbService.getOrders();
      // Match by email or user id
      const userOrders = allOrders.filter(
        (o) => o.user_id === user?.id || o.customer_email.toLowerCase() === user?.email.toLowerCase()
      );
      setOrders(userOrders);
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Sign In Required</h2>
        <p className="text-xs text-neutral-500">Please sign in to view your account details and order history.</p>
        <button
          onClick={() => navigate('home')}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, phone });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('home');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center text-lg font-bold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900">{user.full_name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                user.role === 'admin' 
                  ? 'bg-neutral-900 text-white' 
                  : user.role === 'manager'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-50 text-emerald-800'
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStaff && (
            <button
              onClick={() => navigate('admin-overview')}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Admin Operations</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="px-3.5 py-2 border border-neutral-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Account Details Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
            Account Details & Security
          </h2>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Email (Supabase Auth Identity)</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-neutral-500 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 focus:outline-hidden focus:border-neutral-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Assigned Role: {user.role.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Managed via Supabase profiles table with Row Level Security (RLS) enforcement.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-neutral-700" />
              <span>Personal Order History ({orders.length})</span>
            </h2>
            <button
              onClick={() => navigate('catalog')}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
            >
              Shop More
            </button>
          </div>

          {loadingOrders ? (
            <LoadingState />
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 space-y-3">
              <Package className="w-8 h-8 mx-auto text-neutral-300" />
              <p>You haven't placed any orders with this account yet.</p>
              <button
                onClick={() => navigate('catalog')}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="pt-3 pb-1 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-neutral-900">{order.order_number}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      order.status === 'delivered' || order.status === 'shipped'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 flex justify-between">
                    <span>{new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="font-mono font-bold text-neutral-900">${order.total_amount.toFixed(2)} USD</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {order.items.map((i) => i.product.title_en).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
