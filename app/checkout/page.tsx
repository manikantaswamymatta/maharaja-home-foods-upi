"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/context/CartContext";
import Link from "next/link";
import "./CheckoutPage.css";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaUser,
  FaUpload,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import Tesseract from "tesseract.js";

interface OrderDetails {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  timestamp: string;
  paymentScreenshot?: string;
  utrNumber?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | null>("qr");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !isLoading) {
      router.push("/cart");
    }
  }, [items, router, isLoading]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal >= 1000 ? 0 : 100;
  const total = subtotal + deliveryFee;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
      setScanError(null);
      setScanSuccess(false);
      setUtrNumber(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
        scanScreenshotForUTR(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanScreenshotForUTR = async (file: File) => {
    setIsScanning(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result = await Tesseract.recognize(
          reader.result as string,
          "eng"
        );

        const text = result.data.text;
        const utrMatch =
          text.match(/UTR[:\s]+(\d{12})/i) || text.match(/(\d{12})/);

        if (utrMatch && utrMatch[1]) {
          setUtrNumber(utrMatch[1]);
          setScanSuccess(true);
          setScanError(null);
        } else {
          setScanError(
            "Please upload valid transaction screenshot. We are not able to capture UTR number from your screenshot or image."
          );
          setScanSuccess(false);
          setUtrNumber(null);
        }
      } catch (error) {
        setScanError(
          "Failed to scan screenshot. Please try again or upload another image."
        );
        setScanSuccess(false);
        setUtrNumber(null);
      } finally {
        setIsScanning(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    setUtrNumber(null);
    setScanError(null);
    setScanSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      alert("Please fill in all fields");
      return;
    }

    if (!paymentScreenshot) {
      alert("Please upload payment screenshot");
      return;
    }

    if (!utrNumber) {
      alert(
        "Unable to extract UTR from your screenshot. Please upload a clear photo of your transaction receipt showing the UTR number."
      );
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const screenshotData = reader.result as string;

        const orderDetails: OrderDetails = {
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          items,
          subtotal,
          deliveryFee,
          total,
          timestamp: new Date().toISOString(),
          paymentScreenshot: screenshotData,
          utrNumber,
        };

        const orders = JSON.parse(localStorage.getItem("orders") || "[]");
        orders.push(orderDetails);
        localStorage.setItem("orders", JSON.stringify(orders));

        const businessPhone = "919705338571";
        const upiAddress = "9705338571-4@ybl";

        const orderTextClean = `📦 NEW ORDER RECEIVED\n\n👤 Customer: ${formData.name}\n📱 Phone: ${formData.phone}\n📍 Address: ${formData.address}\n\n💰 Payment Details:\nUPI Address: ${upiAddress}\n💳 UTR Number: ${utrNumber}\n\n🛒 Items Ordered:\n${items.map((i) => `• ${i.name} (${i.weight}) x${i.quantity}`).join("\n")}\n\n💵 Order Total: ₹${total}\n📸 Payment Screenshot: Uploaded by customer\n✅ Status: Ready to Confirm`;

        const businessUrl = `https://wa.me/${businessPhone}?text=${encodeURIComponent(orderTextClean)}`;
        const customerPhoneNum = formData.phone.replace(/^0/, "91");
        const customerTextClean = `✅ Order Placed Successfully!\n\nHi ${formData.name},\n\nYour order has been received and is being processed.\n\n💵 Order Total: ₹${total}\n\n📍 Delivery Address:\n${formData.address}\n\nIf you face any issue with payment, please reach out on 9705338571.\nThank you for your order! 🙏`;
        const customerUrl = `https://wa.me/${customerPhoneNum}?text=${encodeURIComponent(customerTextClean)}`;

        // Open WhatsApp windows
        setTimeout(() => { window.open(businessUrl, "_blank"); }, 100);
        setTimeout(() => { window.open(customerUrl, "_blank"); }, 300);

        // Only clear cart and redirect after order is saved
        clearCart();
        router.push("/order-success");
        // Force reload after navigation to ensure hydration and localStorage sync
        setTimeout(() => {
          window.location.href = "/order-success";
        }, 200);
      };
      reader.readAsDataURL(paymentScreenshot);
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="checkout-loading">
        <p>Redirecting to cart...</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        {/* Checkout Form Section */}
        <div className="checkout-form-section">
          <h1>Checkout</h1>

          <form onSubmit={handlePayment}>
            {/* Customer Name */}
            <div className="form-group">
              <label htmlFor="name">
                <FaUser style={{ marginRight: "8px" }} />
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phone">
                <FaPhone style={{ marginRight: "8px" }} />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
                pattern="[0-9]{10}"
                required
              />
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">
                <FaMapMarkerAlt style={{ marginRight: "8px" }} />
                Delivery Address
              </label>
              <textarea
                id="address"
                name="address"
                placeholder="Enter your delivery address"
                value={formData.address}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>

            {/* Payment Methods */}
            <div className="payment-methods">
              <h3>Payment Method</h3>

              <div className="qr-code-section">
                <h4>Scan to Pay</h4>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <img
                    src="\payment-qr-pic.png"
                    alt="Scan QR to Pay"
                    style={{
                      maxWidth: 220,
                      width: "100%",
                      margin: "0 auto",
                    }}
                  />
                </div>

                <div className="upi-address">
                  <p className="upi-label">Or send payment to:</p>
                  <div className="upi-address-box">
                    <code>9705338571-4@ybl</code>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText("9705338571-4@ybl");
                        alert("UPI address copied!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Screenshot Upload */}
              <div className="screenshot-upload-section">
                <h4>Upload Payment Screenshot</h4>
                <p className="upload-hint">
                  Please upload a screenshot of your payment confirmation
                </p>

                {screenshotPreview ? (
                  <div className="screenshot-preview">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                    />

                    {isScanning && (
                      <div className="scan-status scanning">
                        <div className="spinner"></div>
                        <p>Scanning receipt for UTR...</p>
                      </div>
                    )}

                    {!isScanning && scanSuccess && utrNumber && (
                      <div className="scan-status success">
                        <FaCheckCircle className="status-icon" />
                        <p>
                          UTR Found: <strong>{utrNumber}</strong>
                        </p>
                      </div>
                    )}

                    {!isScanning && scanError && (
                      <div className="scan-status error">
                        <FaTimesCircle className="status-icon" />
                        <p>{scanError}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      className="remove-screenshot-btn"
                      onClick={handleRemoveScreenshot}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-area"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaUpload className="upload-icon" />
                    <p>Click to upload or drag and drop</p>
                    <span>PNG, JPG, JPEG up to 5MB</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  style={{ display: "none" }}
                  required
                />
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="submit"
              className="checkout-btn"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Order Via Whatsapp"}
            </button>

            <p
              className="payment-help"
              style={{
                marginTop: 8,
                color: "#a94442",
                fontWeight: 500,
              }}
            >
              You will be redirected to WhatsApp to submit your order.
            </p>
          </form>
        </div>

        {/* Order Summary Section */}
        <div className="order-summary-section">
          <h2>Order Summary</h2>

          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item-summary">
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p className="weight-qty">
                    {item.weight} × {item.quantity}
                  </p>
                </div>
                <div className="item-price">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {subtotal < 1000 && (
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
          )}

          {subtotal >= 1000 && (
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span className="free-delivery">FREE</span>
            </div>
          )}

          {subtotal < 1000 && (
            <div className="free-delivery-msg">
              Add ₹{1000 - subtotal} more for free delivery!
            </div>
          )}

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Total Amount</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
