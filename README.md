# Malabar Gold & Diamonds — Jewellery Price & Making Charge Calculator

A lightweight, responsive web-based billing and quotation calculator designed for Malabar Gold & Diamonds jewellery estimates.

Built directly according to your custom layout sketch with daily editable 22k gold rates, item weights, making charges, discounts, stone charges, and 3% GST.

---

## 🌟 Key Features

1. **Exact Layout & Multi-Purity Architecture**:
   - **Top Rate Showcase**:
     - **Today's 22k Gold Rate** (Primary Editable Input, e.g. ₹7,450 / g).
     - **24k Pure Gold Rate** (Automatically derived: $22\text{k} \times \frac{24}{22} \approx ₹8,127 / \text{g}$).
     - **18k Gold Rate** (Automatically derived: $22\text{k} \times \frac{18}{22} \approx ₹6,095 / \text{g}$).
   - **Items Table**:
     - `Items & Purity`: Custom item names with individual purity selector (**22K**, **18K**, **24K**). Launches with **Item 1** (default 22k, selectable to 18k).
     - `Items Weight In Grams`: Precise item weight in grams.
     - `Making Charge`: Initial making charge percentage (e.g., 19%, 16%, 17%, 21.9%).
     - `Stone Charge`: Stone & gem charges in ₹.
     - `Discount on making charges (%)`: Discount percentage on initial making charges (e.g., 25%, 75%, 15%, 20%).
     - `Effective Making Charge`: Auto-calculated net making charge % with discount badge.
     - `GST 3% Fixed`: Standard 3% Indian jewellery GST (1.5% CGST + 1.5% SGST).
     - `Old Gold (g)`: Old gold grams with **22K / 18K purity selection** (deducts $\text{Old Gold Grams} \times \text{Selected Rate}$).
     - `Amount Deposited`: Customer advance amount already deposited (₹) deducted from item final price.
     - `Final Price`: Real-time computed net payable price after all charges, GST, Old Gold, and Advance deduction.
   - **Default Single Row on Launch**: Opens cleanly with **1 row (`Item 1`)**; users can add items as needed or reset back to 1 row instantly without popups.
   - **Total Row**: Total weight, total stone charges, total making charges, total discount savings, total GST, total old gold deduction, total advance deposited, and Grand Total Net Payable.

2. **Official Malabar Luxury Theme**:
   - Royal Maroon (`#73132B`) and Imperial Gold (`#C59B27`) accents.
   - Light, airy, warm ivory silk background (`#FBF8F5`) for readability.
   - Elegant typography with Cinzel & Plus Jakarta Sans.

3. **Accurate Jewellery Pricing Mathematics**:
   - $\text{Pure Gold Value} = \text{Item Weight (g)} \times \text{Item Gold Rate (₹/g)}$
   - $\text{Effective Making Charge \%} = \text{Initial Making \%} \times \left(1 - \frac{\text{Discount \%}}{100}\right)$
   - $\text{Effective Making Charge (₹)} = \text{Pure Gold Value} \times \frac{\text{Effective Making Charge \%}}{100}$
   - $\text{Pre-Tax Subtotal} = \text{Pure Gold Value} + \text{Effective Making Charge (₹)} + \text{Stone Charge (₹)}$
   - $\text{GST (3\%)} = \text{Pre-Tax Subtotal} \times 0.03$
   - $\text{Gross New Jewellery Total} = \text{Pre-Tax Subtotal} + \text{GST Amount}$
   - $\text{Old Gold Deduction (₹)} = \text{Old Gold Weight (g)} \times \text{Old Gold Selected Rate (₹/g)}$
   - $\text{Final Net Payable Price} = \max(0, \text{Gross New Jewellery Total} - \text{Old Gold Deduction} - \text{Amount Deposited})$

4. **Added Convenience Features**:
   - **Clickable Breakdown**: Click "View breakdown" on any row to see step-by-step audit calculations.
   - **Print Quotation Slip**: Generates a clean, printable Malabar estimation invoice.
   - **Share WhatsApp Slip**: One-click copy of a formatted quotation text ready to paste in WhatsApp.
   - **Quick Add Presets**: One-click buttons to add Necklaces, Bangle Pairs, Rings, Chains, or 8g Coins.
   - **Duplicate & Remove**: Easily duplicate or delete any item row.
   - **Auto-Save**: Saves changes automatically in browser `localStorage`.

---

## 🚀 How to Run the Website

### Option 1: Direct Browser Open (No Installation Needed)
Simply double-click `index.html` in Windows File Explorer, or drag and drop it into Google Chrome, Microsoft Edge, Firefox, or Brave.

### Option 2: Run with Node.js
If you prefer running a local web server:
```bash
# In this directory:
npm start
# or:
node server.js
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Malabar Calculator/
├── index.html                 # Semantic HTML5 layout with sketch structure & Malabar branding
├── styles.css                 # Malabar theme styling (maroon, gold, light background, print styles)
├── app.js                     # Reactive calculation engine, table handlers, local storage
├── calculator-standalone.html # Single-file bundled offline edition (for WhatsApp / email sharing)
├── server.js                  # Zero-dependency local Node.js static HTTP server
├── package.json               # Package metadata and startup script
└── README.md                  # Documentation & formula explanation
```
