import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DbService } from '../../services/dbService';
import { Order, AffiliateClickLog, Product, Customer } from '../../types';

export const AdminReports: React.FC = () => {
  const { isRtl } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'shein' | 'products' | 'customers'>('sales');
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

  // Aggregated calculations based on live database
  const totalDirectRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalAffiliateCommissions = clicks.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);
  const totalUnitsSold = orders.reduce((sum, o) => sum + o.items.reduce((acc, item) => acc + item.quantity, 0), 0);
  const totalStoreTurnover = totalDirectRevenue + totalAffiliateCommissions;

  // Export report as CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (activeTab === 'sales') {
      csvContent += 'Order Number,Customer Name,Date,Payment Status,Order Status,Total USD\n';
      orders.forEach(o => {
        csvContent += `"${o.order_number}","${o.customer_name}","${new Date(o.created_at).toLocaleDateString()}","${o.payment_status}","${o.status}",${o.total_amount.toFixed(2)}\n`;
      });
    } else if (activeTab === 'shein') {
      csvContent += 'Product ID,Clicked At,Device,Referrer,Est Commission USD\n';
      clicks.forEach(c => {
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
            {isRtl ? `${orders.length} طلبات مؤكدة في النظام` : `${orders.length} completed transactions`}
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
            {isRtl ? `${clicks.length} نقرات ترويجية مسجلة` : `${clicks.length} tracked affiliate outbound clicks`}
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
            {isRtl ? 'عبر كافة تصنيفات المتجر' : 'Across all physical catalog categories'}
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
            {isRtl ? 'عملاء مؤكدون بسجلات شراء' : 'Unique customer profiles recorded'}
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
              {isRtl ? 'تقرير المبيعات والطلبات' : 'Sales & Orders'}
            </button>
            <button
              onClick={() => setActiveTab('shein')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'shein' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'أداء إحالات SHEIN' : 'SHEIN Performance'}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'products' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'المخزون والمنتجات' : 'Products & Catalog'}
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 transition-colors cursor-pointer font-medium ${
                activeTab === 'customers' ? 'bg-neutral-900 text-white font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isRtl ? 'إنفاق العملاء' : 'Customer Activity'}
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
              <span>{isRtl ? 'تصدير التقرير (CSV)' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sales & Orders Breakdown */}
        {activeTab === 'sales' && (
          <div className="p-6 space-y-6">
            <div className="bg-neutral-50 p-4 border border-neutral-200">
              <h4 className="text-xs uppercase font-semibold text-neutral-500 mb-3">
                {isRtl ? 'ملخص تحصيل الطلبات المباشرة' : 'Direct Orders Revenue Flow'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500 block">{isRtl ? 'الطلبات المكتملة' : 'Completed'}</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {orders.filter(o => o.status === 'delivered').length}
                  </span>
                </div>
                <div className="p-3 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500 block">{isRtl ? 'قيد التجهيز / شحن' : 'Processing / Shipping'}</span>
                  <span className="text-lg font-bold text-amber-600">
                    {orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}
                  </span>
                </div>
                <div className="p-3 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500 block">{isRtl ? 'بانتظار التأكيد' : 'Pending'}</span>
                  <span className="text-lg font-bold text-neutral-700">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                </div>
                <div className="p-3 bg-white border border-neutral-200">
                  <span className="text-xs text-neutral-500 block">{isRtl ? 'متوسط قيمة الطلب (AOV)' : 'Avg Order Value'}</span>
                  <span className="text-lg font-bold text-indigo-600">
                    ${orders.length ? (totalDirectRevenue / orders.length).toFixed(2) : '0.00'}
                  </span>
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
                    <th className="px-5 py-3">{isRtl ? 'العناصر' : 'Items'}</th>
                    <th className="px-5 py-3">{isRtl ? 'حالة الدفع' : 'Payment'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map(order => (
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
                      <td className="px-5 py-3 text-xs text-neutral-600">
                        {order.items.length} {isRtl ? 'عناصر' : 'lines'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {order.payment_status}
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
                    {isRtl ? 'تحليلات الربط التابع مع منصة SHEIN' : 'SHEIN Publisher Affiliate Telemetry'}
                  </h4>
                  <p className="text-xs text-amber-900/80 mt-1">
                    {isRtl 
                      ? 'يتم احتساب العمولات التقديرية (10-15%) بناء على النقرات الموجهة بكود الإحالة الخاص بالمتجر.' 
                      : 'Estimated commissions calculated based on 10-15% publisher rev-share upon outbound customer referral visits.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 border-y border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">{isRtl ? 'معرف المنتج / الرابط' : 'Target Asset / SKU'}</th>
                    <th className="px-5 py-3">{isRtl ? 'وقت النقرة' : 'Timestamp'}</th>
                    <th className="px-5 py-3">{isRtl ? 'الجهاز المستهدف' : 'Device'}</th>
                    <th className="px-5 py-3">{isRtl ? 'المصدر الموجه' : 'Referrer'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'العمولة المقدرة' : 'Est. Commission'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {clicks.map(c => (
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
                      <td className="px-5 py-3 text-xs text-neutral-500">
                        {c.referrer || 'Direct Storefront'}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-700">
                <thead className="bg-neutral-50 border-y border-neutral-200 text-xs uppercase text-neutral-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">{isRtl ? 'المنتج' : 'Product'}</th>
                    <th className="px-5 py-3">{isRtl ? 'النوع' : 'Channel'}</th>
                    <th className="px-5 py-3">{isRtl ? 'السعر' : 'Price'}</th>
                    <th className="px-5 py-3">{isRtl ? 'المخزون الحالي' : 'Stock Level'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'حالة التوفر' : 'Availability'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-neutral-900">{p.title_en}</div>
                        <div className="text-xs text-neutral-400 font-mono">{p.sku || p.id}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                          p.is_shein_affiliate ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {p.is_shein_affiliate ? 'SHEIN' : 'Direct'}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-neutral-900">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${p.stock < 10 ? 'text-rose-600' : 'text-neutral-800'}`}>
                          {p.is_shein_affiliate ? 'SHEIN Cloud Stock' : `${p.stock} units`}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'متاح للطلب' : 'Available'}</span>
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
                    <th className="px-5 py-3">{isRtl ? 'اسم العميل' : 'Customer'}</th>
                    <th className="px-5 py-3">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="px-5 py-3">{isRtl ? 'المدينة' : 'Location'}</th>
                    <th className="px-5 py-3">{isRtl ? 'عدد الطلبات' : 'Orders Count'}</th>
                    <th className="px-5 py-3 text-right">{isRtl ? 'إجمالي الإنفاق' : 'Total Spent'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50/80">
                      <td className="px-5 py-3 font-semibold text-neutral-900">
                        {c.full_name}
                      </td>
                      <td className="px-5 py-3 text-xs text-neutral-500 font-mono">
                        {c.email}
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
      </div>
    </div>
  );
};
