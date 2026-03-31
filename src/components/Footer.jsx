export default function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <span className="font-bold text-2xl text-primary mb-4 block">E-Commerce</span>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your one-stop shop for premium products. Quality, trust, and speed guaranteed.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/" className="hover:text-primary transition-colors">All Products</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Categories</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Featured</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Shipping Returns</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Newsletter</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover text-white px-3 py-2 text-sm rounded-r-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} E-Commerce. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
