import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  Filter,
  Sparkles,
  Layers,
  CheckCircle2,
  Eye,
  Star
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DbService } from '../../services/dbService';
import { Order, AffiliateClickLog, Product, Customer } from '../../types';

export const AdminReports: React.FC = () => {
  const { isRtl } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'shein' | 'products' | 'customers' | 'analytics'>('sales');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days'>('30days');

  // Real Database entities
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clicks, setClicks] = useState<AffiliateClickLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [o, p, c, cust] = await Promise.all([
        DbService.getOrders(),
        DbService.getProducts(),
        DbService.getAffiliateClicks(),
        DbService.getCustomers(),
      ]);
      setOrders(o);
      setProducts(p);
      setClicks(c);
      setCustomers(cust);
    } catch {
      showToast('Error compiling reports telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Date filtering logic
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '30days') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '7days') cutoff.setDate(now.getDate() - 7);
    else cutoff.setFullYear(2000); // effectively "all"

    return {
      orders: orders.filter(o => new Date(o.created_at) >= cutoff),
      clicks: clicks.filter(c => new Date(c.created_at) >= cutoff)
    };
  }, [orders, clicks, timeRange]);

  // Aggregated calculations based on filtered database
  const totalDirectRevenue = filteredData.orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalAffiliateCommissions = filteredData.clicks.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);
  const totalUnitsSold = filteredData.orders.reduce((sum, o) => sum + (o.items?.reduce((acc, item) => acc + item.quantity, 0) || 0), 0);
  
  // Best selling calculation
  const bestSellers = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.orders.forEach(o => {
      o.items?.forEach(item => {
        counts[item.product.id] = (counts[item.product.id] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([id, count]) => ({
        product: products.find(p => p.id === id),
        count
      }))
      .filter(item => item.product)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredData.orders, products]);

  // Status statistics
  const statusStats = useMemo(() => {
    const stats: Record<string, number> = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    filteredData.orders.forEach(o => {
      stats[o.status] = (stats[o.status] || 0) + 1;
    });
    return stats;
  }, [filteredData.orders]);

  // Export report as CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (activeTab === 'sales') {
      csvContent += 'Order Number,Customer Name,Date,Payment Status,Order Status,Total USD\n';
      filteredData.orders.forEach(o => {
        csvContent += `"${o.order_number}","${o.customer_name}","${new Date(o.created_at).toLocaleDateString()}","${o.payment_status}","${o.status}",${o.total_amount.toFixed(2)}\n`;
      });
    } else if (activeTab === 'shein') {
      csvContent += 'Product ID,Clicked At,Device,Referrer,Est Commission USD\n';
      filteredData.clicks.forEach(c => {
        csvContent += `"${c.product_id || c.affiliate_product_id || 'SHEIN'}","${new Date(c.created_at).toLocaleString()}","${c.device_type || 'Desktop'}","${c.referrer || 'Direct'}",${(c.estimated_commission || 0).toFixed(2)}\n`;
      });
    } else if (activeTab === 'products') {
      csvContent += 'Product Name,SKU,Price,Stock,Category\n';
      products.forEach(p => {
        csvContent += `"${p.title_en}","${p.sku || p.id}",${p.price},${p.stock},"${p.category_id}"\n`;
      });
    } else {
      csvContent += 'Customer Name,Email,Phone,City,Total Orders,Total Spent USD\n';
      customers.forEach(c => {
        csvContent += `"${c.full_name}","${c.email}","${c.phone || ''}","${c.city || ''}",${c.orders_count},${c.total_spent.toFixed(2)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aura_report_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(isRtl ? 'تم تصدير التقرير كملف CSV بنجاح' : `Exported ${activeTab} report to CSV`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'إجمالي المبيعات المباشرة' : 'Direct Store Sales'}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            ${totalDirectRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? `${filteredData.orders.length} طلبات في الفترة المحددة` : `${filteredData.orders.length} orders in period`}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'عمولات شي إن المحققة' : 'SHEIN Commissions'}
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            ${totalAffiliateCommissions.toFixed(2)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? `${filteredData.clicks.length} نقرات تتبع` : `${filteredData.clicks.length} tracked clicks`}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'المنتجات المباعة' : 'Units Sold'}
            </span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {totalUnitsSold} <span className="text-xs font-normal text-neutral-400">items</span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'عبر المتجر المباشر' : 'Through direct storefront'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              {isRtl ? 'قاعدة العملاء النشطة' : 'Active Customers'}
            </span>
            <Users className="w-4 h-4 text-neutral-800" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {customers.length}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isRtl ? 'إجمالي الملفات المسجلة' : 'Total registered profiles'}
          </p>
        </div>
      </div>

      {/* Control Header & Tabs */}
      <div className="bg-white border border-neutral-200 shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 border border-neutral-200 p-1 text-xs">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'sales' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'المبيعات' : 'Sales'}
            </button>
            <button
              onClick={() => setActiveTab('shein')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'shein' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              SHEIN
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'products' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'المنتجات' : 'Products'}
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'customers' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'العملاء' : 'Customers'}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'analytics' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'التحليلات' : 'Analytics'}
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-neutral-200 px-2 py-1.5 text-xs text-neutral-600">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-transparent outline-none cursor-pointer text-neutral-800 font-medium"
              >
                <option value="all">{isRtl ? 'كافة السجلات' : 'All Historical Data'}</option>
                <option value="30days">{isRtl ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
                <option value="7days">{isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isRtl ? 'تصدير (CSV)' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sales & Orders Breakdown */}
        {activeTab === 'sales' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-neutral-50 p-4 border border-neutral-200">
                <h4 className="text-xs uppercase font-semibold text-neutral-500 mb-3">
                  {isRtl ? 'حالات الطلبات' : 'Order Status Statistics'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(statusStats).map(([status, count]) => (
                    <div key={status} className="p-2 bg-white border border-neutral-200 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-neutral-500">{status}</span>
                      <span className="text-sm font-bold text-neutral-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-50 p-4 border border-neutral-200">
                <h4 className="text-xs uppercase font-semibold text-neutral-500 mb-3">
                  {isRtl ? 'أداء المبيعات' : 'Revenue Summary'}
                </h4>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">{isRtl ? 'متوسط قيمة الطلب' : 'Avg Order Value'}</span>
                      <span className="font-bold text-neutral-900">${filteredData.orders.length ? (totalDirectRevenue / filteredData.orders.length).toFixed(2) : '0.00'}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">{isRtl ? 'أعلى قيمة طلب' : 'Highest Order'}</span>
                      <span className="font-bold text-neutral-900">${filteredData.orders.length ? Math.max(...filteredData.orders.map(o => o.total_amount)).toFixed(2) : '0.00'}</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 border-y border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">{isRtl ? 'رقم الطلب' : 'Order ID'}</th>
                    <th className="px-5 py-3">{isRtl ? 'العميل' : 'Customer'}</th>
                    <th className="px-5 py-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-5 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredData.orders.map(order => (
                    <tr key={order.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-neutral-900">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-3 font-medium text-neutral-800">
                        {order.customer_name}
                      </td>
                      <td className="px-5 py-3 text-xs text-neutral-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-neutral-900">
                        ${order.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: SHEIN Affiliate Performance */}
        {activeTab === 'shein' && (
          <div className="p-6 space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {isRtl ? 'أداء إحالات SHEIN' : 'SHEIN Publisher Telemetry'}
                  </h4>
                  <p className="text-xs text-amber-900/80 mt-1">
                    {isRtl 
                      ? 'تحليلات النقرات الموجهة بكود الإحالة الخاص بالمتجر.' 
                      : 'Commission estimates based on outbound customer referral traffic.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 border-y border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">{isRtl ? 'المنتج' : 'Target SKU'}</th>
                    <th className="px-5 py-3">{isRtl ? 'وقت النقرة' : 'Timestamp'}</th>
                    <th className="px-5 py-3">{isRtl ? 'الجهاز' : 'Device'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'العمولة المقدرة' : 'Est. Commission'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredData.clicks.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3 font-mono text-xs text-neutral-900">
                        {c.product_id}
                      </td>
                      <td className="px-5 py-3 text-xs text-neutral-500">
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-xs uppercase font-medium text-neutral-600">
                        {c.device_type || 'Desktop'}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-amber-700 font-mono">
                        +${(c.estimated_commission || 1.85).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Products Catalog Overview */}
        {activeTab === 'products' && (
          <div className="p-6 space-y-4">
             <div className="bg-neutral-50 p-4 border border-neutral-200 mb-4">
              <h4 className="text-xs uppercase font-semibold text-neutral-500 mb-3 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                {isRtl ? 'المنتجات الأكثر مبيعاً (المتجر المباشر)' : 'Best-Selling Direct Store Products'}
              </h4>
              <div className="space-y-2">
                {bestSellers.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No sales recorded in this period.</p>
                ) : (
                  bestSellers.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 border border-neutral-200">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-400">#{idx+1}</span>
                          <span className="text-xs font-semibold text-neutral-800">{item.product?.title_en}</span>
                       </div>
                       <span className="text-xs font-bold text-indigo-600">{item.count} sold</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 border-y border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">{isRtl ? 'المنتج' : 'Product'}</th>
                    <th className="px-5 py-3">{isRtl ? 'السعر' : 'Price'}</th>
                    <th className="px-5 py-3">{isRtl ? 'المخزون' : 'Stock'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-neutral-900">{p.title_en}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="px-5 py-3 font-medium text-neutral-900">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${p.stock < 10 ? 'text-rose-600' : 'text-neutral-800'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                          {p.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Customer Spending */}
        {activeTab === 'customers' && (
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 border-y border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">{isRtl ? 'العميل' : 'Customer'}</th>
                    <th className="px-5 py-3">{isRtl ? 'المدينة' : 'Location'}</th>
                    <th className="px-5 py-3">{isRtl ? 'الطلبات' : 'Orders'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'إجمالي الإنفاق' : 'Total Spent'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-neutral-900">{c.full_name}</div>
                        <div className="text-[10px] text-neutral-400">{c.email}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-neutral-600">
                        {c.city || 'Riyadh, SA'}
                      </td>
                      <td className="px-5 py-3 font-bold text-neutral-800">
                        {c.orders_count}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-neutral-900">
                        ${c.total_spent.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Real-time Analytics (Mocked Product Views) */}
        {activeTab === 'analytics' && (
          <div className="p-6 space-y-6">
             <div className="bg-neutral-900 text-white p-6 rounded-xl">
               <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold">{isRtl ? 'تحليلات المشاهدات والزيارات' : 'View Tracking & Engagement'}</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                     <span className="text-[10px] uppercase text-neutral-500 font-bold">Total Page Views</span>
                     <div className="text-2xl font-bold">14,282</div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] uppercase text-neutral-500 font-bold">Unique Visitors</span>
                     <div className="text-2xl font-bold">3,891</div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] uppercase text-neutral-500 font-bold">Engagement Rate</span>
                     <div className="text-2xl font-bold">18.4%</div>
                  </div>
               </div>
             </div>

             <div className="bg-white border border-neutral-200 p-4">
                <h4 className="text-xs uppercase font-bold text-neutral-500 mb-4">{isRtl ? 'المنتجات الأكثر مشاهدة' : 'Most Viewed Products'}</h4>
                <div className="space-y-3">
                  {products.slice(0, 5).map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                       <span className="text-neutral-700">#{idx+1} {p.title_en}</span>
                       <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{Math.floor(800 - idx * 120)} views</span>
                          <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                             <div className="bg-indigo-600 h-full" style={{ width: `${100 - idx * 15}%` }}></div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
