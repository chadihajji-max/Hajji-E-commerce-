import React, { useState, useEffect } from 'react';
import { Warehouse, Search, AlertTriangle, CheckCircle2, XCircle, Plus, Minus, Save } from 'lucide-react';
import { Product } from '../../types';
import { DbService } from '../../services/dbService';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await DbService.getProducts();
      setProducts(data);
      const initialMap: Record<string, number> = {};
      data.forEach(p => { initialMap[p.id] = p.stock; });
      setStockEdits(initialMap);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockChange = (id: string, delta: number) => {
    setStockEdits(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta)
    }));
  };

  const handleSaveSingle = async (p: Product) => {
    const newQty = stockEdits[p.id];
    if (newQty === undefined) return;
    await DbService.updateStock(p.id, newQty);
    showToast(`Stock updated for ${p.sku}: ${newQty} units`, 'success');
    loadData();
  };

  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const filtered = products.filter((p) => {
    if (stockFilter === 'low' && !(p.stock > 0 && p.stock <= 10)) return false;
    if (stockFilter === 'out' && p.stock !== 0) return false;
    if (stockFilter === 'in' && p.stock <= 10) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Total Warehouse Stock</span>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">{totalUnits} units</div>
          <p className="text-[10px] text-neutral-400">Across {products.length} catalog items</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Warning (&le; 10 units)</span>
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">{lowStockCount} items</div>
          <p className="text-[10px] text-amber-600">Reorder recommended</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 space-y-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
          </span>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">{outOfStockCount} items</div>
          <p className="text-[10px] text-rose-600">Currently unavailable for order</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or product title..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-neutral-900"
          />
        </div>

        {/* Filter segment */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              stockFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              stockFilter === 'low' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              stockFilter === 'out' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState variant="table" count={5} />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3 text-right">Quick Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((p) => {
                  const currentStockVal = stockEdits[p.id] ?? p.stock;
                  const hasChanged = currentStockVal !== p.stock;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.title_en}
                            className="w-9 h-9 object-cover rounded bg-neutral-100 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-semibold text-neutral-900 line-clamp-1">{p.title_en}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" />
                            <span>Sold Out</span>
                          </span>
                        ) : p.stock <= 10 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-neutral-900 text-sm">
                        {p.stock} units
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="inline-flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
                            <button
                              onClick={() => handleStockChange(p.id, -5)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-900 font-bold"
                              title="Decrease 5"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleStockChange(p.id, -1)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-900"
                              title="Decrease 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={currentStockVal}
                              onChange={(e) => setStockEdits({ ...stockEdits, [p.id]: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-14 text-center bg-white border-x border-neutral-200 py-1 font-mono font-bold text-xs"
                            />
                            <button
                              onClick={() => handleStockChange(p.id, +1)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-900"
                              title="Increase 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleStockChange(p.id, +10)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-900 font-bold"
                              title="Increase 10"
                            >
                              +10
                            </button>
                          </div>

                          {hasChanged && (
                            <button
                              onClick={() => handleSaveSingle(p)}
                              className="px-2.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Save Stock"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
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
    </div>
  );
};
