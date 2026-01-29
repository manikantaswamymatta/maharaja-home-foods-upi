import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h3>Maharaja Home Foods</h3>
          <p>
            Authentic homemade Indian sweets, savouries, pickles, ghee and honey.
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <p>Home</p>
          <p>About</p>
          <p>Products</p>
          <p>Gallery</p>
          <p>Reviews</p>
          <p>Contact</p>
        </div>

        <div>
          <h4>Contact Us</h4>
          <p>📞 9705338571</p>
          <p>✉️ rajaganirajukuppala@gmail.com</p>
          <p>📍 Draksharama, A.P - 533262</p>
          <p>📸 @maga_maharaja</p>
        </div>

        <div>
          <h4>Business Hours</h4>
          <p>Mon - Fri: 9AM to 5PM</p>
          <p>Saturday: 9AM to 1PM</p>
          <p>Sunday: Holiday</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Maharaja Home Foods. All rights reserved.
      </div>
    </footer>
  );
}
