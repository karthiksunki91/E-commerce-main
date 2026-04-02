"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Spinner from '@/components/Spinner';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categorizing, setCategorizing] = useState(false);

  // Search & Bulk Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    category_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [{ data: prodData, error: productsError }, { data: catData, error: catError }] = await Promise.all([
          supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name', { ascending: true })
        ]);

        if (productsError) throw productsError;
        setProducts(prodData || []);
        if (!catError) setCategories(catData || []);
      } catch (err) {
        console.error("Fetch products error:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Failed to delete product. It may be linked to existing orders.");
    }
  };

  const handleAutoCategorize = async () => {
    if (!confirm("This will automatically create standard categories and assign them to existing uncategorized products. Proceed?")) return;
    setCategorizing(true);
    try {
      // 1. Create categories
      const categoriesToCreate = [
        { name: "Electronics" },
        { name: "Home & Office" },
        { name: "Accessories" },
        { name: "Sports & Fitness" }
      ];

      for (const cat of categoriesToCreate) {
        // use upsert based on name (if unique conflict exists)
        await supabase.from('categories').upsert(cat, { onConflict: 'name' });
      }

      const { data: createdCategories } = await supabase.from('categories').select('*');
      const catMap = {};
      createdCategories.forEach(c => catMap[c.name] = c.id);

      // 2. Map existing products
      const categoryMappings = {
        "Premium Wireless Headphones": "Electronics",
        "Minimalist Smartwatch": "Electronics",
        "Mechanical Keyboard": "Electronics",
        "4K Action Camera": "Electronics",
        "Smart Home Hub": "Electronics",
        "Portable SSD 1TB": "Electronics",
        "Noise-Isolating Earbuds": "Electronics",
        "Wireless Charging Pad": "Electronics",
        "Ergonomic Office Chair": "Home & Office",
        "Ceramic Coffee Dripper": "Home & Office",
        "Chef's Knife 8-Inch": "Home & Office",
        "Leather Messenger Bag": "Accessories",
        "Polarized Sunglasses": "Accessories",
        "Stainless Steel Water Bottle": "Accessories",
        "Yoga Mat with Alignment Lines": "Sports & Fitness"
      };

      // 3. Update products
      for (const [productName, categoryName] of Object.entries(categoryMappings)) {
        const catId = catMap[categoryName];
        if (catId) {
          await supabase
            .from('products')
            .update({ category_id: catId })
            .eq('name', productName)
            .is('category_id', null);
        }
      }

      alert("Successfully categorized legacy products!");
      window.location.reload();
      
    } catch (err) {
      console.error("Categorize error:", err);
      alert("Failed to categorize products.");
    } finally {
      setCategorizing(false);
    }
  };

  // --- Search & Bulk Selection Handlers ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectionMode = (productId = null) => {
    setSelectionMode(true);
    if (productId && typeof productId === 'string' && !selectedProductIds.includes(productId)) {
      setSelectedProductIds([productId]);
    } else if (productId && typeof productId !== 'object' && !selectedProductIds.includes(productId)) {
       setSelectedProductIds([productId]);
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedProductIds([]);
  };

  const toggleProductSelection = (productId) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    } else {
      setSelectedProductIds(prev => [...prev, productId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]); // Deselect all
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id)); // Select all filtered
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) return;

    setIsDeletingBulk(true);
    try {
      const { error: bulkError } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProductIds);

      if (bulkError) throw bulkError;

      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)));
      cancelSelection();
      
      alert(`Successfully deleted ${selectedProductIds.length} products.`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete selected products. Some items might be linked to existing orders.");
    } finally {
      setIsDeletingBulk(false);
    }
  };
  // ----------------------------------------

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: newProduct.name,
        description: newProduct.description || null,
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock) || 0,
        image_url: newProduct.image_url || null,
        category_id: newProduct.category_id || null
      };

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setProducts([data, ...products]);
      setNewProduct({ name: '', description: '', price: '', stock: '', image_url: '', category_id: '' });
      alert("Product added successfully! Refresh to see category names update.");
    } catch (err) {
      console.error("Add product error:", err);
      alert("Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 w-full animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Products Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Add, update, or remove products. Double-click a product to enter Select Mode.</p>
        </div>
        <div className="flex items-center gap-3">
          {!selectionMode && (
            <button
              onClick={() => toggleSelectionMode()}
              className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 font-bold py-2.5 px-5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span>Select Mode</span>
            </button>
          )}

          <button
            onClick={handleAutoCategorize}
            disabled={categorizing || selectionMode}
            className="flex items-center gap-2 bg-slate-900 dark:bg-zinc-800 text-white font-bold py-2.5 px-5 rounded-xl transition-colors hover:bg-slate-800 dark:hover:bg-zinc-700 shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {categorizing ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            )}
            <span>{categorizing ? 'Categorizing...' : 'Auto-Categorize'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-200 shadow-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Products List */}
        <div className="w-full xl:w-2/3 space-y-4">
          
          {/* Search Header / Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
            {selectionMode ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary dark:text-primary-light">
                    {selectedProductIds.length} selected
                  </span>
                  <button
                    onClick={cancelSelection}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                
                {selectedProductIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeletingBulk}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-75"
                  >
                    {isDeletingBulk ? <Spinner size="sm" className="text-white" /> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    )}
                    Delete Selected
                  </button>
                )}
              </div>
            ) : (
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl leading-5 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-950">
                  <tr>
                    {selectionMode && (
                      <th className="px-6 py-4 text-left w-12 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-950 focus:ring-2 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={selectionMode ? 5 : 4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                        No products found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => {
                      const isSelected = selectedProductIds.includes(product.id);
                      return (
                        <tr 
                          key={product.id} 
                          onDoubleClick={() => toggleSelectionMode(product.id)}
                          className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                        >
                          {selectionMode && (
                            <td className="px-6 py-5 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(product.id)}
                                className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-900 focus:ring-2 dark:bg-zinc-800 dark:border-zinc-700 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                          <div className="h-12 w-12 flex-shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700">
                            {product.image_url ? (
                              <img className="h-full w-full object-cover" src={product.image_url} alt="" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 font-medium">No Img</div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate w-48" title={product.name}>{product.name}</div>
                            {product.categories?.name && (
                              <div className="text-xs text-primary font-medium mt-0.5">{product.categories.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 dark:text-white font-extrabold">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold flex items-center justify-end w-full gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add New Product Form */}
        <div className="w-full xl:w-1/3">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 sticky top-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create Product</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Name *</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                  placeholder="e.g. Graphic T-Shirt"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock *</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select 
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm appearance-none"
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cover Image URL</label>
                <input 
                  type="url" 
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                  className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea 
                  rows="4"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none shadow-sm"
                  placeholder="Describe the product..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Save Product
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
