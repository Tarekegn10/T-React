function Footer() {
    return (
    <footer>
        <div className="footer-content">
            <div className="footer-section">
                <h3>Gentleman's Step</h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.95rem" }}>Crafting the finest footwear for the modern man. Quality, comfort, and style in every step.</p>
            </div>
            <div className="footer-section">
                <h3>Shop</h3>
                <ul>
                    <li><a href="#">New Arrivals</a></li>
                    <li><a href="#">Formal Shoes</a></li>
                    <li><a href="#">Casual Sneakers</a></li>
                    <li><a href="#">Boots</a></li>
                </ul>
            </div>
            <div className="footer-section">
                <h3>Support</h3>
                <ul>
                    <li><a href="#">Contact Us</a></li>
                    <li><a href="#">Size Guide</a></li>
                    <li><a href="#">Shipping & Returns</a></li>
                </ul>
            </div>
            <div className="footer-section">
                <h3>Follow Us</h3>
                <div className="social-icons">
                    <a href="#" className="social-link" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.406 6.406a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0zM12 5.838a6.162 6.162 0 1 1 0 12.324A6.162 6.162 0 0 1 12 5.838zm0 10.162a3.999 3.999 0 1 0 0-7.998A3.999 3.999 0 0 0 12 16z"/></svg></a>
                    <a href="#" className="social-link" aria-label="Twitter"><svg viewBox="0 0 24 24"><path d="M23.954 4.569a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951-.053-2.004.118-2.749.555a4.92 4.92 0 0 0-8.384 4.482A13.978 13.978 0 0 1 1.671 3.149a4.822 4.822 0 0 0-.666 2.475c0 1.708.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.061a4.923 4.923 0: -webkit-font-smoothing: antialiased; 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.224.084 4.936 4.936 0 0 0 4.604 3.417A9.867 9.867 0 0 1 .96 19.54a13.94 13.94 0 0 0 7.548 2.209c9.142 0 14.307-7.721 13.995-14.646a9.936 9.936 0 0 0 2.411-2.534z"/></svg></a>
                    <a href="#" className="social-link" aria-label="watsapp"><svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.406 6.406a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0zM12 5.838a6.162 6.162 0 1 1 0 12.324A6.162 6.162 0 0 1 12 5.838zm0 10.162a3.999 3.999 0 1 0 0-7.998A3.999 3.999 0 0 0 12 16z"/></svg></a>
                    <a href="#" className="social-link" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.837 12.003h-2.07v8.21h-3.29v-8.21H6.5V9.356h2.977V7.797c0-2.955 1.803-4.566 4.437-4.566 1.26 0 2.343.094 2.658.136v3.08h-1.823c-1.43 0-1.707.68-1.707 1.676v2.202h3.41l-.444 2.647h-2.966v8.21h5.813v-8.21h2.07l-.31-2z"/></svg></a>
                </div>
            </div>
        </div>
    </footer>
    );
  }
  
  export default Footer;