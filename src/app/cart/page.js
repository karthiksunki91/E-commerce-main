"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartItem from '@/components/CartItem';
import Spinner from '@/components/Spinner';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Checkout flow state: 1: Cart, 2: Address, 3: Payment
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Form states
  const [addressDetails, setAddressDetails] = useState({
    country: 'India',
    fullName: '',
    mobile: '',
    pincode: '',
    flat: '',
    area: '',
    landmark: '',
    city: '',
    state: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');

  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('cart_items')
          .select('id, quantity, product_id, products(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        setCartItems(data || []);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load cart items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const handleUpdateItem = (itemId, newQuantity) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    router.refresh(); 
  };

  const cartTotal = cartItems.reduce((total, item) => {
    if (!item.products) return total;
    return total + (item.quantity * item.products.price);
  }, 0);

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (addressDetails.pincode.length !== 6) {
      alert("Please enter a valid 6-digit Pincode.");
      return;
    }
    setCheckoutStep(3); // Go to Payment
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      // Format comprehensive string representing address + payment
      const fullAddressString = `Payment Method: ${paymentMethod.toUpperCase()}
Name: ${addressDetails.fullName}
Phone: ${addressDetails.mobile}
Address: ${addressDetails.flat}, ${addressDetails.area}${addressDetails.landmark ? ', ' + addressDetails.landmark : ''}
${addressDetails.city}, ${addressDetails.state} - ${addressDetails.pincode}
Country: ${addressDetails.country}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_price: cartTotal,
          status: 'pending',
          address: fullAddressString
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      const orderId = orderData.id;

      const orderItemsToInsert = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price 
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearError) throw clearError;

      setCheckoutSuccess(true);
      setCartItems([]);
      router.refresh();

    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[80vh] p-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-500 font-medium">Loading your secure cart...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[80vh] p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm flex flex-col items-center justify-center py-20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (checkoutSuccess) {
    return (
      <main className="min-h-[80vh] p-4 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center text-center animate-fadeIn">
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl shadow-xl border border-green-100 dark:border-green-900 flex flex-col items-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-zinc-900 opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 w-24 h-24 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-inner animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="relative z-10 text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Order Confirmed!</h2>
          <p className="relative z-10 text-gray-500 dark:text-gray-400 mb-10 max-w-sm text-lg">Your purchase was successful. We'll send you an email when your items ship.</p>
          <Link 
            href="/" 
            className="relative z-10 w-full bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 text-lg active:scale-95 duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] p-4 md:p-8 pt-12 max-w-7xl mx-auto animate-fadeIn flex flex-col items-center lg:items-start">
      
      {/* Checkout Steps Progress Bar */}
      {cartItems.length > 0 && (
        <div className="w-full max-w-3xl mx-auto mb-10 px-4">
          <div className="flex items-center justify-between relative before:absolute before:top-1/2 before:translate-y-[-50%] before:h-0.5 before:w-full before:bg-gray-200 dark:before:bg-zinc-800 before:-z-10">
            <div className={`flex flex-col items-center gap-2 bg-white dark:bg-black px-4 transition-colors ${checkoutStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${checkoutStep >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white dark:bg-zinc-900 text-gray-500'}`}>1</div>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Cart</span>
            </div>
            <div className={`flex flex-col items-center gap-2 bg-white dark:bg-black px-4 transition-colors ${checkoutStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${checkoutStep >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white dark:bg-zinc-900 text-gray-500'}`}>2</div>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Address</span>
            </div>
            <div className={`flex flex-col items-center gap-2 bg-white dark:bg-black px-4 transition-colors ${checkoutStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${checkoutStep >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white dark:bg-zinc-900 text-gray-500'}`}>3</div>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Payment</span>
            </div>
          </div>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="w-full bg-white dark:bg-zinc-900 p-16 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center mt-12">
          <div className="w-32 h-32 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your bag is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-md text-lg">Looks like you haven't added anything to your cart yet. Browse our selection and discover our latest arrivals!</p>
          <Link 
            href="/" 
            className="bg-primary text-white font-bold py-4 px-10 rounded-full hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 text-lg hover:-translate-y-1"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">
          
          {/* Main Content Area */}
          <div className="w-full lg:w-2/3">
            
            {/* Step 1: Cart Items */}
            {checkoutStep === 1 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 animate-fadeIn">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight px-4 pt-4">Shopping Bag</h1>
                {cartItems.map((item, index) => (
                  <div key={item.id}>
                    <CartItem 
                      item={item} 
                      onUpdate={handleUpdateItem} 
                      onRemove={handleRemoveItem} 
                    />
                    {index < cartItems.length - 1 && (
                      <div className="my-6 border-b border-gray-100 dark:border-zinc-800/60 mx-4"></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Address Form */}
            {checkoutStep === 2 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-zinc-800 animate-fadeIn">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setCheckoutStep(1)} className="text-gray-400 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Delivery Address</h1>
                </div>

                <form id="addressForm" onSubmit={handleAddressSubmit} className="space-y-6">
                  {/* Indian Form layout typically used in Amazon/Flipkart */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Country/Region</label>
                    <select 
                      disabled
                      className="w-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-xl px-4 py-3 opacity-80 cursor-not-allowed"
                    >
                      <option>India</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                      <input 
                        type="text" required
                        value={addressDetails.fullName}
                        onChange={e => setAddressDetails(p => ({...p, fullName: e.target.value}))}
                        className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mobile Number *</label>
                      <input 
                        type="tel" required
                        placeholder="10-digit number"
                        pattern="[0-9]{10}"
                        value={addressDetails.mobile}
                        onChange={e => setAddressDetails(p => ({...p, mobile: e.target.value}))}
                        className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Pincode *</label>
                    <input 
                      type="text" required
                      placeholder="6 digits [0-9]"
                      pattern="[0-9]{6}"
                      value={addressDetails.pincode}
                      onChange={e => setAddressDetails(p => ({...p, pincode: e.target.value}))}
                      className="w-full md:w-1/2 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Flat, House no., Building, Company, Apartment *</label>
                    <input 
                      type="text" required
                      value={addressDetails.flat}
                      onChange={e => setAddressDetails(p => ({...p, flat: e.target.value}))}
                      className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Area, Street, Sector, Village *</label>
                    <input 
                      type="text" required
                      value={addressDetails.area}
                      onChange={e => setAddressDetails(p => ({...p, area: e.target.value}))}
                      className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Landmark</label>
                    <input 
                      type="text" placeholder="E.g. near apollo hospital"
                      value={addressDetails.landmark}
                      onChange={e => setAddressDetails(p => ({...p, landmark: e.target.value}))}
                      className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Town/City *</label>
                      <input 
                        type="text" required
                        value={addressDetails.city}
                        onChange={e => setAddressDetails(p => ({...p, city: e.target.value}))}
                        className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State *</label>
                      <select 
                        required
                        value={addressDetails.state}
                        onChange={e => setAddressDetails(p => ({...p, state: e.target.value}))}
                        className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm appearance-none"
                      >
                        <option value="" disabled>Choose a state</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <input type="checkbox" id="default" className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="default" className="text-gray-700 dark:text-gray-300 font-medium">Make this my default address</label>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Payment Simulation */}
            {checkoutStep === 3 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-zinc-800 animate-fadeIn">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setCheckoutStep(2)} className="text-gray-400 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Select Payment</h1>
                </div>

                <div className="space-y-4">
                  {/* UPI */}
                  <label className={`block border-2 rounded-2xl p-6 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="upi" 
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary" 
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">UPI (GPay, PhonePe, Paytm)</span>
                        <div className="hidden sm:flex gap-2 opacity-70">
                          {/* Fake logos */}
                          <div className="w-8 h-5 bg-green-500 rounded flex items-center justify-center text-[8px] text-white font-bold">GPay</div>
                          <div className="w-8 h-5 bg-purple-600 rounded flex items-center justify-center text-[8px] text-white font-bold">Pe</div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Cards */}
                  <label className={`block border-2 rounded-2xl p-6 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="card" 
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary" 
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">Credit / Debit Card</span>
                        <div className="hidden sm:flex gap-2 opacity-70">
                          <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold">VISA</div>
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="mt-4 pl-9 space-y-4 animate-fadeIn">
                        <input type="text" placeholder="Card Number" className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3" />
                        <div className="flex gap-4">
                          <input type="text" placeholder="MM/YY" className="w-1/2 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3" />
                          <input type="text" placeholder="CVV" className="w-1/2 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl px-4 py-3" />
                        </div>
                      </div>
                    )}
                  </label>

                  {/* COD */}
                  <label className={`block border-2 rounded-2xl p-6 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'}`}>
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cod" 
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary" 
                      />
                      <span className="font-bold text-lg text-gray-900 dark:text-white">Cash on Delivery (COD)</span>
                    </div>
                  </label>
                </div>
              </div>
            )}
            
          </div>

          {/* Checkout Summary Sidebar */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-zinc-800 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
              
              <div className="space-y-5 mb-8 text-[15px]">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-zinc-800 pt-6 mb-8">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-extrabold text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {checkoutStep === 1 && (
                <button 
                  onClick={() => setCheckoutStep(2)}
                  className="w-full bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 text-lg flex items-center justify-center gap-3 active:scale-95 duration-200 group"
                >
                  Proceed to Checkout
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}

              {checkoutStep === 2 && (
                <button 
                  type="submit"
                  form="addressForm"
                  className="w-full bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 text-lg flex items-center justify-center gap-3 active:scale-95 duration-200 group"
                >
                  Use this Address
                </button>
              )}

              {checkoutStep === 3 && (
                <button 
                  onClick={handlePlaceOrder}
                  disabled={checkoutLoading}
                  className="w-full bg-primary text-white font-bold py-4 px-8 rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 text-lg disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 duration-200 group"
                >
                  {checkoutLoading ? (
                    <Spinner size="sm" className="text-white" />
                  ) : (
                    <>
                      Place Order
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </>
                  )}
                </button>
              )}
              
              <div className="mt-6 flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  256-bit Secure Checkout
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
