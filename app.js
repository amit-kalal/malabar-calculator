/**
 * Malabar Gold & Diamonds - Jewellery Price & Making Charge Calculator
 * Multi-Purity Architecture: 22K, 18K, and 24K Gold Rates & Old Gold Exchange
 */

// Default initial items: Launch and Reset with exactly 1 row (Item 1, selectable 22k / 18k)
function getDefaultInitialItems() {
  return [
    {
      id: 'item-1',
      name: 'Item 1',
      purity: '22k',
      weight: '',
      makingCharge: '',
      stoneCharge: '0',
      discount: '',
      oldGold: '',
      oldGoldPurity: '22k',
      deposit: '',
      gst: 3
    }
  ];
}

// App State
let appState = {
  goldRate: 7450, // Today's 22k gold rate in INR per gram
  goldRate24k: Math.round(7450 * (24 / 22)), // Auto-derived 24k rate (~8127)
  goldRate18k: Math.round(7450 * (18 / 22)), // Auto-derived 18k rate (~6095)
  items: getDefaultInitialItems()
};

// Currency & Number Formatters (Indian Rupee System)
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0
});

/**
 * Clean round helper to prevent floating point inaccuracies
 */
function round2(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

/**
 * Format percentage nicely (e.g. 14.25%, 4%, 21.9%)
 */
function formatPercent(val) {
  const num = Number(val) || 0;
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2).replace(/\.?0+$/, '')}%`;
}

/**
 * Get gold rate per gram for a specific purity
 */
function getRateForPurity(purity) {
  const p = (purity || '22k').toLowerCase();
  if (p === '18k') return appState.goldRate18k;
  if (p === '24k') return appState.goldRate24k;
  return appState.goldRate; // 22k default
}

/**
 * Calculate all price components for an item based on its purity & old gold purity
 */
function calculateItem(item) {
  const weight = Math.max(0, parseFloat(item.weight) || 0);
  const initialMakingPercent = Math.max(0, parseFloat(item.makingCharge) || 0);
  const discountPercent = Math.max(0, parseFloat(item.discount) || 0);
  const stoneCharge = Math.max(0, parseFloat(item.stoneCharge) || 0);
  const gstPercent = Math.max(0, parseFloat(item.gst !== undefined ? item.gst : 3) || 0);
  const oldGoldWeight = Math.max(0, parseFloat(item.oldGold) || 0);

  // 1. Determine rate for this item based on its purity (22k vs 18k vs 24k)
  const itemPurity = (item.purity || '22k').toLowerCase();
  const itemRate = getRateForPurity(itemPurity);

  // 2. Base Gold Value of new jewellery = Weight (g) * Item Rate (₹/g)
  const baseGoldValue = weight * itemRate;

  // 3. Effective Making Charge %:
  // Ex: 17% initial, 25% discount => 17 * (1 - 0.25) = 12.75%
  let effectiveMakingPercent = initialMakingPercent;
  if (discountPercent > 0) {
    effectiveMakingPercent = initialMakingPercent * (1 - (discountPercent / 100));
  }
  effectiveMakingPercent = round2(effectiveMakingPercent);

  // 4. Making Charges in ₹ (calculated on total weight of new gold purchased)
  const effectiveMakingRupees = round2(baseGoldValue * (effectiveMakingPercent / 100));
  const grossMakingRupees = round2(baseGoldValue * (initialMakingPercent / 100));
  const discountSavingsRupees = Math.max(0, grossMakingRupees - effectiveMakingRupees);

  // 5. Pre-Tax Subtotal = Base Gold + Effective Making Charges + Stone Charges
  const preTaxSubtotal = round2(baseGoldValue + effectiveMakingRupees + stoneCharge);

  // 6. GST (3% Fixed on Subtotal)
  const gstRupees = round2(preTaxSubtotal * (gstPercent / 100));

  // 7. Gross New Jewellery Amount (inclusive of 3% GST)
  const grossItemTotal = round2(preTaxSubtotal + gstRupees);

  // 8. Determine rate for Old Gold based on its selected purity (22k vs 18k)
  const oldGoldPurity = (item.oldGoldPurity || '22k').toLowerCase();
  const oldGoldRate = getRateForPurity(oldGoldPurity);

  // 9. Old Gold Exchange Credit = Old Gold Weight (g) * Old Gold Rate (₹/g)
  const oldGoldValue = round2(oldGoldWeight * oldGoldRate);

  // 10. Amount Deposited / Advance Paid (in ₹)
  const depositAmount = Math.max(0, parseFloat(item.deposit) || 0);

  // 11. Final Net Payable Price & Excess Refund Amount
  const netDiff = round2(grossItemTotal - oldGoldValue - depositAmount);
  let finalPrice = 0;
  let refundAmount = 0;
  if (netDiff >= 0) {
    finalPrice = netDiff;
    refundAmount = 0;
  } else {
    finalPrice = 0;
    refundAmount = round2(Math.abs(netDiff));
  }

  return {
    itemPurity,
    itemRate,
    weight,
    baseGoldValue,
    initialMakingPercent,
    discountPercent,
    effectiveMakingPercent,
    grossMakingRupees,
    effectiveMakingRupees,
    discountSavingsRupees,
    stoneCharge,
    preTaxSubtotal,
    gstPercent,
    gstRupees,
    grossItemTotal,
    oldGoldPurity,
    oldGoldRate,
    oldGoldWeight,
    oldGoldValue,
    depositAmount,
    finalPrice,
    refundAmount
  };
}

/**
 * Build and render table DOM structure
 * ONLY called when items are added, removed, duplicated, or reset.
 * Does NOT get called on keystrokes, ensuring input focus is never lost.
 */
function renderTableStructure() {
  const tbody = document.getElementById('items-tbody');
  tbody.innerHTML = '';

  appState.items.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.dataset.itemId = item.id;
    tr.id = `row-${item.id}`;

    const currentPurity = (item.purity || '22k').toLowerCase();
    const currentOldGoldPurity = (item.oldGoldPurity || '22k').toLowerCase();

    tr.innerHTML = `
      <!-- Column 1: Items & Purity -->
      <td>
        <div class="item-name-cell-wrap">
          <input 
            type="text" 
            class="table-input item-name" 
            value="${escapeHtml(item.name || `Item ${index + 1}`)}" 
            data-field="name"
            placeholder="Item ${index + 1}"
            title="Edit item name"
          />
          <select class="purity-select" id="purity-select-${item.id}" data-field="purity" title="Item Gold Purity">
            <option value="22k" ${currentPurity === '22k' ? 'selected' : ''}>22K (${inrWholeFormatter.format(appState.goldRate)}/g)</option>
            <option value="18k" ${currentPurity === '18k' ? 'selected' : ''}>18K (${inrWholeFormatter.format(appState.goldRate18k)}/g)</option>
            <option value="24k" ${currentPurity === '24k' ? 'selected' : ''}>24K (${inrWholeFormatter.format(appState.goldRate24k)}/g)</option>
          </select>
          <div class="item-rate-subtext" id="rate-subtext-${item.id}">
            Rate: ${inrWholeFormatter.format(getRateForPurity(currentPurity))}/g
          </div>
        </div>
      </td>

      <!-- Column 2: Items Weight In Grams -->
      <td>
        <div class="table-input-wrap">
          <input 
            type="number" 
            class="table-input number-input" 
            value="${item.weight !== undefined && item.weight !== null ? item.weight : ''}" 
            data-field="weight" 
            min="0" 
            step="any" 
            placeholder="0.00"
            title="Enter item weight in grams"
          />
          <span class="input-suffix">g</span>
        </div>
      </td>

      <!-- Column 3: Making Charge (%) -->
      <td>
        <div class="table-input-wrap">
          <input 
            type="number" 
            class="table-input number-input" 
            value="${item.makingCharge !== undefined && item.makingCharge !== null ? item.makingCharge : ''}" 
            data-field="makingCharge" 
            min="0" 
            max="100" 
            step="any" 
            placeholder="0"
            title="Initial Making Charge Percentage"
          />
          <span class="input-suffix">%</span>
        </div>
      </td>

      <!-- Column 4: Stone Charge (₹) -->
      <td>
        <div class="table-input-wrap">
          <span class="input-prefix">₹</span>
          <input 
            type="number" 
            class="table-input currency-input" 
            value="${item.stoneCharge !== undefined && item.stoneCharge !== null ? item.stoneCharge : 0}" 
            data-field="stoneCharge" 
            min="0" 
            step="any" 
            placeholder="0"
            title="Stone & gem charges in INR"
          />
        </div>
      </td>

      <!-- Column 5: Making Charge Discount (%) -->
      <td>
        <div class="table-input-wrap">
          <input 
            type="number" 
            class="table-input number-input" 
            value="${item.discount !== undefined && item.discount !== null ? item.discount : ''}" 
            data-field="discount" 
            min="0" 
            max="100" 
            step="any" 
            placeholder="0"
            title="Discount percentage applied on making charges"
          />
          <span class="input-suffix">%</span>
        </div>
      </td>

      <!-- Column 6: Effective Making Charge (Calculated %) -->
      <td>
        <div class="effective-badge-wrap">
          <span class="effective-badge cell-effective-badge" id="badge-${item.id}">
            0%
          </span>
          <span class="effective-savings-pill cell-savings-pill" id="savings-${item.id}">
            No Discount
          </span>
        </div>
      </td>

      <!-- Column 7: GST 3% Fixed -->
      <td>
        <div class="table-input-wrap">
          <span class="gst-badge" title="Fixed 3% GST (1.5% CGST + 1.5% SGST)">
            3% Fixed
          </span>
        </div>
      </td>

      <!-- Column 8: Old Gold (In Grams) with 22k / 18k Purity Selection -->
      <td>
        <div class="oldgold-cell-wrap">
          <div class="table-input-wrap">
            <input 
              type="number" 
              class="table-input number-input" 
              value="${item.oldGold !== undefined && item.oldGold !== null ? item.oldGold : ''}" 
              data-field="oldGold" 
              min="0" 
              step="any" 
              placeholder="0.00"
              title="Old gold given by customer (in grams)"
            />
            <span class="input-suffix">g</span>
          </div>
          <div class="oldgold-purity-row">
            <select class="oldgold-purity-select" id="oldgold-purity-select-${item.id}" data-field="oldGoldPurity" title="Select 22K or 18K Old Gold">
              <option value="22k" ${currentOldGoldPurity === '22k' ? 'selected' : ''}>22K Old Gold (${inrWholeFormatter.format(appState.goldRate)}/g)</option>
              <option value="18k" ${currentOldGoldPurity === '18k' ? 'selected' : ''}>18K Old Gold (${inrWholeFormatter.format(appState.goldRate18k)}/g)</option>
            </select>
          </div>
          <div class="oldgold-deduction-wrap" id="oldgold-deduct-${item.id}">
          </div>
        </div>
      </td>

      <!-- Column 9: Amount Deposited (₹ Advance) -->
      <td>
        <div class="table-input-wrap">
          <span class="input-prefix">₹</span>
          <input 
            type="number" 
            class="table-input currency-input" 
            value="${item.deposit !== undefined && item.deposit !== null ? item.deposit : ''}" 
            data-field="deposit" 
            min="0" 
            step="any" 
            placeholder="0"
            title="Advance amount already deposited for this item"
          />
        </div>
        <div class="deposit-deduction-wrap" id="deposit-deduct-${item.id}">
        </div>
      </td>

      <!-- Column 10: Final Price (₹ Payable) -->
      <td>
        <div class="final-price-wrap">
          <span class="final-price-value cell-final-price" id="final-${item.id}">₹0</span>
          <div id="refund-${item.id}"></div>
          <button type="button" class="final-price-breakdown-btn" data-breakdown-id="${item.id}" title="Click to view step-by-step breakdown">
            View breakdown
          </button>
        </div>
      </td>

      <!-- Actions Column -->
      <td>
        <div class="row-actions-wrap">
          <button type="button" class="row-action-btn duplicate-btn" data-action="duplicate" data-id="${item.id}" title="Duplicate this row">
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button type="button" class="row-action-btn delete-btn" data-action="delete" data-id="${item.id}" title="Remove this item">
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    // Individual Item Subtotal / Pricing Row (Directly below this item)
    const trSub = document.createElement('tr');
    trSub.className = 'item-subtotal-row';
    trSub.id = `subrow-${item.id}`;
    trSub.dataset.itemId = item.id;
    trSub.innerHTML = `
      <!-- Column 1: Subtotal Item Label -->
      <td>
        <div class="item-subtotal-label" id="sub-label-${item.id}">
          ↳ ${escapeHtml(item.name || `Item ${index + 1}`)} Total
        </div>
      </td>

      <!-- Column 2: Pure Gold Value -->
      <td>
        <span class="sub-val gold" id="sub-gold-${item.id}">₹0</span>
      </td>

      <!-- Column 3: Initial Making Charge Amount -->
      <td>
        <span class="sub-val" id="sub-making-${item.id}">₹0</span>
      </td>

      <!-- Column 4: Stone Charge Amount -->
      <td>
        <span class="sub-val" id="sub-stone-${item.id}">₹0</span>
      </td>

      <!-- Column 5: Discount Saved Amount -->
      <td>
        <span class="sub-val savings" id="sub-discount-${item.id}">Saved ₹0</span>
      </td>

      <!-- Column 6: Effective Making Charge Amount -->
      <td>
        <span class="sub-val" id="sub-effmaking-${item.id}">₹0</span>
      </td>

      <!-- Column 7: GST 3% Amount -->
      <td>
        <span class="sub-val" id="sub-gst-${item.id}">₹0</span>
      </td>

      <!-- Column 8: Old Gold Deducted Amount -->
      <td>
        <span class="sub-val deduct" id="sub-oldgold-${item.id}">₹0</span>
      </td>

      <!-- Column 9: Amount Deposited (Advance) -->
      <td>
        <span class="sub-val deposit" id="sub-deposit-${item.id}">₹0</span>
      </td>

      <!-- Column 10: Final Price / Refund -->
      <td>
        <span class="sub-val final" id="sub-final-${item.id}">₹0</span>
      </td>

      <!-- Column 11: Actions Empty -->
      <td></td>
    `;
    tbody.appendChild(trSub);
  });

  // Perform initial calculation update
  updateCalculations();
}

/**
 * Fast Reactive Update for Calculations
 * Runs on every keystroke without touching or re-rendering input elements!
 */
function updateCalculations() {
  // 1. Recalculate 24k and 18k rates from current 22k gold rate
  appState.goldRate24k = Math.round(appState.goldRate * (24 / 22));
  appState.goldRate18k = Math.round(appState.goldRate * (18 / 22));

  // Update top banner auto-display cards
  const el24k = document.getElementById('rate-24k-display');
  const el18k = document.getElementById('rate-18k-display');
  if (el24k) el24k.textContent = appState.goldRate24k.toLocaleString('en-IN');
  if (el18k) el18k.textContent = appState.goldRate18k.toLocaleString('en-IN');

  let totalWeight = 0;
  let totalBaseGold = 0;
  let totalEffectiveMaking = 0;
  let totalGrossMaking = 0;
  let totalDiscountSavings = 0;
  let totalStone = 0;
  let totalGst = 0;
  let totalOldGoldWeight = 0;
  let totalOldGoldValue = 0;
  let totalDeposit = 0;
  let grandTotal = 0;

  appState.items.forEach((item, index) => {
    const calc = calculateItem(item);

    totalWeight += calc.weight;
    totalBaseGold += calc.baseGoldValue;
    totalEffectiveMaking += calc.effectiveMakingRupees;
    totalGrossMaking += calc.grossMakingRupees;
    totalDiscountSavings += calc.discountSavingsRupees;
    totalStone += calc.stoneCharge;
    totalGst += calc.gstRupees;
    totalOldGoldWeight += calc.oldGoldWeight;
    totalOldGoldValue += calc.oldGoldValue;
    totalDeposit += calc.depositAmount;
    grandTotal += calc.finalPrice;

    // Update row calculated cells without re-rendering inputs
    const badgeEl = document.getElementById(`badge-${item.id}`);
    const savingsEl = document.getElementById(`savings-${item.id}`);
    const oldGoldDeductEl = document.getElementById(`oldgold-deduct-${item.id}`);
    const depositDeductEl = document.getElementById(`deposit-deduct-${item.id}`);
    const finalEl = document.getElementById(`final-${item.id}`);
    const refundEl = document.getElementById(`refund-${item.id}`);
    const rateSubtextEl = document.getElementById(`rate-subtext-${item.id}`);

    // Update purity dropdown option labels with current live gold rates
    const puritySelect = document.getElementById(`purity-select-${item.id}`);
    if (puritySelect) {
      const opt22 = puritySelect.querySelector('option[value="22k"]');
      const opt18 = puritySelect.querySelector('option[value="18k"]');
      const opt24 = puritySelect.querySelector('option[value="24k"]');
      if (opt22) opt22.textContent = `22K (${inrWholeFormatter.format(appState.goldRate)}/g)`;
      if (opt18) opt18.textContent = `18K (${inrWholeFormatter.format(appState.goldRate18k)}/g)`;
      if (opt24) opt24.textContent = `24K (${inrWholeFormatter.format(appState.goldRate24k)}/g)`;
    }

    // Update old gold dropdown option labels with current live gold rates
    const oldGoldSelect = document.getElementById(`oldgold-purity-select-${item.id}`);
    if (oldGoldSelect) {
      const ogOpt22 = oldGoldSelect.querySelector('option[value="22k"]');
      const ogOpt18 = oldGoldSelect.querySelector('option[value="18k"]');
      if (ogOpt22) ogOpt22.textContent = `22K Old Gold (${inrWholeFormatter.format(appState.goldRate)}/g)`;
      if (ogOpt18) ogOpt18.textContent = `18K Old Gold (${inrWholeFormatter.format(appState.goldRate18k)}/g)`;
    }

    // Update rate subtext / gold valuation badge directly under item name
    if (rateSubtextEl) {
      if (calc.weight > 0) {
        rateSubtextEl.innerHTML = `Rate: ${inrWholeFormatter.format(calc.itemRate)}/g <span class="rate-subtext-val">• Gold: ${inrWholeFormatter.format(calc.baseGoldValue)}</span>`;
      } else {
        rateSubtextEl.textContent = `Rate: ${inrWholeFormatter.format(calc.itemRate)}/g`;
      }
    }

    if (badgeEl) {
      badgeEl.textContent = formatPercent(calc.effectiveMakingPercent);
      badgeEl.title = `Initial ${calc.initialMakingPercent}% minus ${calc.discountPercent}% discount`;
    }

    if (savingsEl) {
      if (calc.discountPercent > 0) {
        savingsEl.textContent = `Save ${calc.discountPercent}% (₹${Math.round(calc.discountSavingsRupees).toLocaleString('en-IN')})`;
        savingsEl.style.color = 'var(--success-green)';
      } else {
        savingsEl.textContent = 'No Discount';
        savingsEl.style.color = 'var(--text-muted)';
      }
    }

    if (oldGoldDeductEl) {
      if (calc.oldGoldWeight > 0) {
        oldGoldDeductEl.innerHTML = `<span class="oldgold-deduct-pill" title="${calc.oldGoldWeight}g × ₹${calc.oldGoldRate.toLocaleString('en-IN')}/g (${calc.oldGoldPurity.toUpperCase()})">-₹${Math.round(calc.oldGoldValue).toLocaleString('en-IN')} (${calc.oldGoldPurity.toUpperCase()})</span>`;
      } else {
        oldGoldDeductEl.innerHTML = '';
      }
    }

    if (depositDeductEl) {
      if (calc.depositAmount > 0) {
        depositDeductEl.innerHTML = `<span class="deposit-deduct-pill" title="Advance deposited">-₹${Math.round(calc.depositAmount).toLocaleString('en-IN')} Adv.</span>`;
      } else {
        depositDeductEl.innerHTML = '';
      }
    }

    if (finalEl) {
      finalEl.textContent = inrWholeFormatter.format(calc.finalPrice);
    }

    if (refundEl) {
      if (calc.refundAmount > 0) {
        refundEl.innerHTML = `<span class="item-refund-pill" title="Excess advance deposited">Refund: ${inrWholeFormatter.format(calc.refundAmount)}</span>`;
      } else {
        refundEl.innerHTML = '';
      }
    }

    // Update individual subtotal row elements for this item
    const subLabelEl = document.getElementById(`sub-label-${item.id}`);
    const subGoldEl = document.getElementById(`sub-gold-${item.id}`);
    const subMakingEl = document.getElementById(`sub-making-${item.id}`);
    const subStoneEl = document.getElementById(`sub-stone-${item.id}`);
    const subDiscountEl = document.getElementById(`sub-discount-${item.id}`);
    const subEffMakingEl = document.getElementById(`sub-effmaking-${item.id}`);
    const subGstEl = document.getElementById(`sub-gst-${item.id}`);
    const subOldGoldEl = document.getElementById(`sub-oldgold-${item.id}`);
    const subDepositEl = document.getElementById(`sub-deposit-${item.id}`);
    const subFinalEl = document.getElementById(`sub-final-${item.id}`);

    if (subLabelEl) {
      subLabelEl.innerHTML = `↳ ${escapeHtml(item.name || `Item ${index + 1}`)} Total`;
    }
    if (subGoldEl) {
      subGoldEl.textContent = inrWholeFormatter.format(calc.baseGoldValue);
    }
    if (subMakingEl) {
      subMakingEl.textContent = inrWholeFormatter.format(calc.grossMakingRupees);
    }
    if (subStoneEl) {
      subStoneEl.textContent = inrWholeFormatter.format(calc.stoneCharge);
    }
    if (subDiscountEl) {
      subDiscountEl.textContent = calc.discountSavingsRupees > 0 
        ? `Saved ${inrWholeFormatter.format(calc.discountSavingsRupees)}`
        : 'Saved ₹0';
    }
    if (subEffMakingEl) {
      subEffMakingEl.textContent = inrWholeFormatter.format(calc.effectiveMakingRupees);
    }
    if (subGstEl) {
      subGstEl.textContent = inrWholeFormatter.format(calc.gstRupees);
    }
    if (subOldGoldEl) {
      subOldGoldEl.textContent = calc.oldGoldValue > 0 
        ? `-₹${Math.round(calc.oldGoldValue).toLocaleString('en-IN')}` 
        : '₹0';
    }
    if (subDepositEl) {
      subDepositEl.textContent = calc.depositAmount > 0 
        ? `-₹${Math.round(calc.depositAmount).toLocaleString('en-IN')}` 
        : '₹0';
    }
    if (subFinalEl) {
      if (calc.refundAmount > 0) {
        subFinalEl.innerHTML = `<span style="color:#059669; font-weight:800;">Refund: ${inrWholeFormatter.format(calc.refundAmount)}</span>`;
      } else {
        subFinalEl.textContent = inrWholeFormatter.format(calc.finalPrice);
      }
    }
  });

  // Calculate Overall Net Balance across all items
  const totalGrossAllItems = round2(totalBaseGold + totalEffectiveMaking + totalStone + totalGst);
  const totalCreditsAllItems = round2(totalOldGoldValue + totalDeposit);
  const overallDiff = round2(totalGrossAllItems - totalCreditsAllItems);
  const overallNetPayable = overallDiff > 0 ? overallDiff : 0;
  const overallRefund = overallDiff < 0 ? round2(Math.abs(overallDiff)) : 0;

  // Update Bottom Total Row (Grand Total)
  const totalRowLabel = document.getElementById('total-row-label');
  if (totalRowLabel) {
    totalRowLabel.textContent = appState.items.length > 1 ? `GRAND TOTAL (${appState.items.length} Items)` : 'TOTAL';
  }

  // Column 1 (Weight): Displays pure gold price according to gold rate with weight subtext
  const totalWeightEl = document.getElementById('total-weight-display');
  if (totalWeightEl) {
    totalWeightEl.innerHTML = `${inrWholeFormatter.format(totalBaseGold)}<span class="footer-subtext">(${totalWeight.toFixed(3)} g)</span>`;
  }

  // Column 2 (Making Charge): Displays initially charged making amount in ₹
  const totalMakingEl = document.getElementById('total-making-display');
  if (totalMakingEl) {
    totalMakingEl.innerHTML = `${inrWholeFormatter.format(totalGrossMaking)}<span class="footer-subtext">(Initial)</span>`;
  }

  // Column 3 (Stone Charge): Displays stone charges amount in ₹
  const totalStoneEl = document.getElementById('total-stone-display');
  if (totalStoneEl) {
    totalStoneEl.textContent = inrWholeFormatter.format(totalStone);
  }

  // Column 4 (Discount on Making Charges): Displays discount savings amount in ₹
  const totalDiscountEl = document.getElementById('total-discount-savings-display');
  if (totalDiscountEl) {
    totalDiscountEl.textContent = `Saved ${inrWholeFormatter.format(totalDiscountSavings)}`;
  }
  
  // Column 5 (Effective Making Charge): Displays charged amount after effective making charges in ₹
  const avgEffectiveMaking = totalBaseGold > 0 ? (totalEffectiveMaking / totalBaseGold) * 100 : 0;
  const avgEffectiveMakingEl = document.getElementById('avg-effective-making-display');
  if (avgEffectiveMakingEl) {
    avgEffectiveMakingEl.innerHTML = `${inrWholeFormatter.format(totalEffectiveMaking)}<span class="footer-subtext">(${avgEffectiveMaking.toFixed(2)}% eff.)</span>`;
  }

  // Column 6 (GST): Displays GST amount in ₹
  const totalGstEl = document.getElementById('total-gst-display');
  if (totalGstEl) {
    totalGstEl.textContent = inrWholeFormatter.format(totalGst);
  }
  
  // Column 7 (Old Gold): Displays total Old Gold exchange deduction
  const totalOldGoldEl = document.getElementById('total-oldgold-display');
  if (totalOldGoldEl) {
    totalOldGoldEl.innerHTML = totalOldGoldValue > 0 
      ? `-₹${Math.round(totalOldGoldValue).toLocaleString('en-IN')}<span class="footer-subtext">(${totalOldGoldWeight.toFixed(3)} g)</span>`
      : '₹0';
  }

  // Column 8 (Amount Deposited): Displays total advance deposited
  const totalDepositEl = document.getElementById('total-deposit-display');
  if (totalDepositEl) {
    totalDepositEl.textContent = totalDeposit > 0 ? `-₹${Math.round(totalDeposit).toLocaleString('en-IN')}` : '₹0';
  }

  // Column 9 (Final Price): Displays Net Payable and Customer Refund if excess
  const grandTotalEl = document.getElementById('grand-total-display');
  const grandRefundEl = document.getElementById('grand-refund-display');
  if (grandTotalEl) {
    grandTotalEl.textContent = inrWholeFormatter.format(overallNetPayable);
  }
  if (grandRefundEl) {
    if (overallRefund > 0) {
      grandRefundEl.innerHTML = `<span class="total-refund-pill" title="Excess advance to be refunded">Refund Customer: ${inrWholeFormatter.format(overallRefund)}</span>`;
    } else {
      grandRefundEl.innerHTML = '';
    }
  }

  // Update Summary Cards Grid
  document.getElementById('card-gold-value').textContent = inrWholeFormatter.format(totalBaseGold);
  document.getElementById('card-gold-weight').textContent = `${totalWeight.toFixed(3)} grams total`;

  document.getElementById('card-making-charges').textContent = inrWholeFormatter.format(totalEffectiveMaking);
  document.getElementById('card-making-savings').textContent = `You save ₹${Math.round(totalDiscountSavings).toLocaleString('en-IN')} in discounts!`;

  document.getElementById('card-stone-charges').textContent = inrWholeFormatter.format(totalStone);
  document.getElementById('card-gst-charges').textContent = inrWholeFormatter.format(totalGst);

  document.getElementById('card-oldgold-value').textContent = 
    totalOldGoldValue > 0 ? `-₹${Math.round(totalOldGoldValue).toLocaleString('en-IN')}` : '₹0';
  document.getElementById('card-oldgold-weight').textContent = 
    `${totalOldGoldWeight.toFixed(3)} g exchanged`;

  const cardDepositVal = document.getElementById('card-deposit-value');
  const cardDepositMeta = document.getElementById('card-deposit-meta');
  if (cardDepositVal) {
    cardDepositVal.textContent = totalDeposit > 0 ? `-₹${Math.round(totalDeposit).toLocaleString('en-IN')}` : '₹0';
  }
  if (cardDepositMeta) {
    cardDepositMeta.textContent = totalDeposit > 0 ? `₹${Math.round(totalDeposit).toLocaleString('en-IN')} advance paid` : 'No advance paid';
  }

  // Hero Total Card & Customer Refund Banner
  document.getElementById('card-grand-total').textContent = inrWholeFormatter.format(overallNetPayable);
  document.getElementById('hero-items-count').textContent = `${appState.items.length} ${appState.items.length === 1 ? 'Item' : 'Items'}`;
  
  const heroBadge = document.getElementById('hero-total-badge');
  const heroNote = document.getElementById('hero-total-note');
  const heroRefundBanner = document.getElementById('hero-refund-banner');
  if (overallRefund > 0) {
    if (heroBadge) heroBadge.textContent = 'NET PAYABLE: ₹0 • REFUND DUE';
    if (heroNote) heroNote.textContent = `Advance exceeds total jewellery charges. Refund ₹${Math.round(overallRefund).toLocaleString('en-IN')} to customer.`;
    if (heroRefundBanner) {
      heroRefundBanner.innerHTML = `
        <div class="hero-refund-box">
          <span class="hero-refund-tag">REFUND TO CUSTOMER</span>
          <span class="hero-refund-amount">${inrWholeFormatter.format(overallRefund)}</span>
          <span class="hero-refund-sub">Excess advance deposited beyond total jewellery price</span>
        </div>
      `;
    }
  } else {
    if (heroBadge) heroBadge.textContent = 'NET PAYABLE AMOUNT';
    if (heroNote) heroNote.textContent = 'After Making, Discounts, GST, Old Gold & Advance Deposits';
    if (heroRefundBanner) heroRefundBanner.innerHTML = '';
  }

  const totalCombinedDeductions = totalDiscountSavings + totalOldGoldValue + totalDeposit;
  document.getElementById('hero-total-savings').textContent = 
    totalCombinedDeductions > 0 ? `Total Deductions: ₹${Math.round(totalCombinedDeductions).toLocaleString('en-IN')}` : 'Total Deductions: ₹0';

  // Update Mobile Sticky Bar
  document.getElementById('sticky-count').textContent = appState.items.length;
  if (overallRefund > 0) {
    document.getElementById('sticky-total').textContent = `₹0 (Refund: ${inrWholeFormatter.format(overallRefund)})`;
  } else {
    document.getElementById('sticky-total').textContent = inrWholeFormatter.format(overallNetPayable);
  }
  
  let stickyDeductSummary = `(Saved ₹${Math.round(totalDiscountSavings).toLocaleString('en-IN')})`;
  if (totalOldGoldValue > 0 && totalDeposit > 0) {
    stickyDeductSummary = `(Old Gold -₹${Math.round(totalOldGoldValue).toLocaleString('en-IN')} | Adv -₹${Math.round(totalDeposit).toLocaleString('en-IN')})`;
  } else if (totalOldGoldValue > 0) {
    stickyDeductSummary = `(Old Gold -₹${Math.round(totalOldGoldValue).toLocaleString('en-IN')})`;
  } else if (totalDeposit > 0) {
    stickyDeductSummary = `(Advance -₹${Math.round(totalDeposit).toLocaleString('en-IN')})`;
  }
  document.getElementById('sticky-savings').textContent = stickyDeductSummary;

  // Save to LocalStorage
  saveStateToStorage();
}

/**
 * Handle input changes dynamically on keystrokes
 */
function handleTableInput(e) {
  const target = e.target;
  const tr = target.closest('tr');
  if (!tr) return;

  const itemId = tr.dataset.itemId;
  const field = target.dataset.field;
  if (!field) return;

  const item = appState.items.find(i => i.id === itemId);
  if (!item) return;

  // Store the raw typed value directly so partial numbers like '16.', '19.9', '0.' are preserved
  item[field] = target.value;

  // Update calculations without destroying or touching DOM inputs!
  updateCalculations();
}

/**
 * Handle select dropdown changes dynamically (Item purity, Old Gold purity)
 */
function handleTableSelectChange(e) {
  const target = e.target;
  const tr = target.closest('tr');
  if (!tr) return;

  const itemId = tr.dataset.itemId;
  const field = target.dataset.field;
  if (!field) return;

  const item = appState.items.find(i => i.id === itemId);
  if (!item) return;

  item[field] = target.value;
  updateCalculations();
}

/**
 * Add a new item row
 */
function addNewItem(preset = null) {
  const count = appState.items.length + 1;
  const newItem = {
    id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: preset?.name || `Item ${count}`,
    purity: preset?.purity || '22k',
    weight: preset?.weight !== undefined ? String(preset.weight) : '',
    makingCharge: preset?.making !== undefined ? String(preset.making) : '',
    stoneCharge: preset?.stone !== undefined ? String(preset.stone) : '0',
    discount: preset?.discount !== undefined ? String(preset.discount) : '',
    oldGold: preset?.oldGold !== undefined ? String(preset.oldGold) : '',
    oldGoldPurity: preset?.oldGoldPurity || '22k',
    deposit: preset?.deposit !== undefined ? String(preset.deposit) : '',
    gst: 3
  };

  appState.items.push(newItem);
  renderTableStructure();
  showToast(`Added ${newItem.name}`);
}

/**
 * Duplicate an existing row
 */
function duplicateItem(id) {
  const index = appState.items.findIndex(i => i.id === id);
  if (index === -1) return;

  const orig = appState.items[index];
  const copy = {
    ...JSON.parse(JSON.stringify(orig)),
    id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: `${orig.name} (Copy)`
  };

  appState.items.splice(index + 1, 0, copy);
  renderTableStructure();
  showToast(`Duplicated ${orig.name}`);
}

/**
 * Delete a row
 */
function deleteItem(id) {
  if (appState.items.length <= 1) {
    showToast('At least one item must remain in calculator');
    return;
  }

  const item = appState.items.find(i => i.id === id);
  const name = item ? item.name : 'Item';
  appState.items = appState.items.filter(i => i.id !== id);
  renderTableStructure();
  showToast(`Removed ${name}`);
}

/**
 * Show detailed calculation breakdown in modal
 */
function showItemBreakdown(id) {
  const item = appState.items.find(i => i.id === id);
  if (!item) return;

  const calc = calculateItem(item);

  document.getElementById('modal-item-title').textContent = `${item.name || 'Item'} (${calc.itemPurity.toUpperCase()}) — Price Calculation Breakdown`;
  document.getElementById('modal-item-subtitle').textContent = `Valuation at ₹${calc.itemRate.toLocaleString('en-IN')}/g (${calc.itemPurity.toUpperCase()} Gold Rate)`;

  const modalContent = document.getElementById('modal-item-content');
  modalContent.innerHTML = `
    <div class="audit-row">
      <span>1. Purity of New Item:</span>
      <strong>${calc.itemPurity.toUpperCase()} (Rate: ₹${calc.itemRate.toLocaleString('en-IN')} / g)</strong>
    </div>
    <div class="audit-row">
      <span>2. Weight of New Item:</span>
      <strong>${calc.weight.toFixed(3)} grams</strong>
    </div>
    <div class="audit-row">
      <span>3. Pure Gold Value (Weight &times; ${calc.itemPurity.toUpperCase()} Rate):</span>
      <strong>₹${Math.round(calc.baseGoldValue).toLocaleString('en-IN')}</strong>
    </div>
    <div class="audit-row">
      <span>4. Initial Making Charge:</span>
      <span>${calc.initialMakingPercent}% of Gold Value (<del>₹${Math.round(calc.grossMakingRupees).toLocaleString('en-IN')}</del>)</span>
    </div>
    <div class="audit-row">
      <span>5. Making Charge Discount:</span>
      <span style="color:var(--success-green); font-weight:700">
        ${calc.discountPercent}% Off (-₹${Math.round(calc.discountSavingsRupees).toLocaleString('en-IN')})
      </span>
    </div>
    <div class="audit-row">
      <span>6. Effective Making Charge:</span>
      <span><strong>${calc.effectiveMakingPercent}%</strong> = <strong>₹${Math.round(calc.effectiveMakingRupees).toLocaleString('en-IN')}</strong></span>
    </div>
    <div class="audit-row">
      <span>7. Stone &amp; Gem Charges:</span>
      <strong>₹${calc.stoneCharge.toLocaleString('en-IN')}</strong>
    </div>
    <div class="audit-row" style="background:#FAF6EE; padding:8px 8px; border-radius:6px; margin:4px 0;">
      <span><strong>Subtotal (Pre-Tax):</strong><br><small style="color:var(--text-muted)">(Gold + Eff. Making + Stone)</small></span>
      <strong style="font-size:1.02rem;">₹${Math.round(calc.preTaxSubtotal).toLocaleString('en-IN')}</strong>
    </div>
    <div class="audit-row">
      <span>8. GST (3% Fixed on Subtotal):</span>
      <strong>₹${Math.round(calc.gstRupees).toLocaleString('en-IN')}</strong>
    </div>
    <div class="audit-row" style="background:#FAF8F5; padding:8px 8px; border-radius:6px; margin:4px 0;">
      <span><strong>Gross Jewellery Amount:</strong></span>
      <strong>₹${Math.round(calc.grossItemTotal).toLocaleString('en-IN')}</strong>
    </div>
    ${calc.oldGoldWeight > 0 ? `
      <div class="audit-row" style="color:#B45309; background:#FEF3C7; padding:8px 8px; border-radius:6px; margin:4px 0;">
        <span><strong>Less: ${calc.oldGoldPurity.toUpperCase()} Old Gold Exchanged:</strong><br><small>${calc.oldGoldWeight}g &times; ₹${calc.oldGoldRate.toLocaleString('en-IN')}/g (${calc.oldGoldPurity.toUpperCase()} Rate)</small></span>
        <strong style="font-size:1.05rem;">-₹${Math.round(calc.oldGoldValue).toLocaleString('en-IN')}</strong>
      </div>
    ` : ''}
    ${calc.depositAmount > 0 ? `
      <div class="audit-row" style="color:#065F46; background:#D1FAE5; padding:8px 8px; border-radius:6px; margin:4px 0;">
        <span><strong>Less: Amount Deposited (Advance Paid):</strong><br><small>Advance amount already deposited for this item</small></span>
        <strong style="font-size:1.05rem;">-₹${Math.round(calc.depositAmount).toLocaleString('en-IN')}</strong>
      </div>
    ` : ''}
    ${calc.refundAmount > 0 ? `
      <div class="audit-row refund-highlight" style="background:#ECFDF5; border:1.5px solid #10B981; padding:10px 12px; border-radius:6px; margin:8px 0; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:#065F46; font-size:1rem; display:block;">EXCESS ADVANCE REFUND DUE:</strong>
          <small style="color:#047857;">Advance payment exceeds gross jewellery price</small>
        </div>
        <strong style="font-size:1.35rem; color:#059669;">${inrWholeFormatter.format(calc.refundAmount)}</strong>
      </div>
    ` : ''}
    <div class="audit-row highlight">
      <span>FINAL NET PAYABLE AMOUNT:</span>
      <span style="font-size:1.35rem; color:var(--malabar-maroon);">
        ${inrWholeFormatter.format(calc.finalPrice)}
      </span>
    </div>
  `;

  document.getElementById('breakdown-modal').classList.remove('hidden');
}

/**
 * Share summary / Copy WhatsApp quotation slip
 */
function shareWhatsAppQuotation() {
  const dateStr = quotationDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  let text = `👑 *MALABAR GOLD & DIAMONDS*\n`;
  text += `*Jewellery Estimation & Price Quotation*\n`;
  text += `📅 Date: ${dateStr}\n`;
  text += `✨ Today's 22k Gold Rate: ₹${appState.goldRate.toLocaleString('en-IN')} / g\n`;
  text += `✨ Today's 18k Gold Rate: ₹${appState.goldRate18k.toLocaleString('en-IN')} / g\n`;
  text += `✨ Today's 24k Gold Rate: ₹${appState.goldRate24k.toLocaleString('en-IN')} / g\n`;
  text += `------------------------------------\n\n`;

  let totalWeight = 0;
  let totalOldGoldGrams = 0;
  let totalOldGoldCredit = 0;
  let totalDeposit = 0;
  let grandTotal = 0;
  let totalSavings = 0;

  appState.items.forEach((item, idx) => {
    const calc = calculateItem(item);
    totalWeight += calc.weight;
    totalOldGoldGrams += calc.oldGoldWeight;
    totalOldGoldCredit += calc.oldGoldValue;
    totalDeposit += calc.depositAmount;
    grandTotal += calc.finalPrice;
    totalSavings += calc.discountSavingsRupees;

    text += `*${idx + 1}. ${item.name || `Item ${idx + 1}`} (${calc.itemPurity.toUpperCase()})*\n`;
    text += `   • Rate: ₹${calc.itemRate.toLocaleString('en-IN')}/g (${calc.itemPurity.toUpperCase()})\n`;
    text += `   • Weight: ${calc.weight} g\n`;
    text += `   • Making: ${calc.initialMakingPercent}% (Discount: ${calc.discountPercent}% → Eff: ${calc.effectiveMakingPercent}%)\n`;
    if (calc.stoneCharge > 0) {
      text += `   • Stone Charge: ₹${calc.stoneCharge.toLocaleString('en-IN')}\n`;
    }
    if (calc.oldGoldWeight > 0) {
      text += `   • Old Gold (${calc.oldGoldPurity.toUpperCase()}): ${calc.oldGoldWeight} g (-₹${Math.round(calc.oldGoldValue).toLocaleString('en-IN')})\n`;
    }
    if (calc.depositAmount > 0) {
      text += `   • Amount Deposited: -₹${Math.round(calc.depositAmount).toLocaleString('en-IN')}\n`;
    }
    if (calc.refundAmount > 0) {
      text += `   • Net Payable: *₹0* (Customer Refund Due: *${inrWholeFormatter.format(calc.refundAmount)}*)\n\n`;
    } else {
      text += `   • Price (incl. 3% GST): *${inrWholeFormatter.format(calc.finalPrice)}*\n\n`;
    }
  });

  const totalGrossQuotation = round2(totalWeight > 0 ? (appState.items.reduce((s, it) => s + (calculateItem(it).grossItemTotal), 0)) : 0);
  const totalCreditsQuotation = round2(totalOldGoldCredit + totalDeposit);
  const quotationDiff = round2(totalGrossQuotation - totalCreditsQuotation);
  const quotationPayable = quotationDiff > 0 ? quotationDiff : 0;
  const quotationRefund = quotationDiff < 0 ? round2(Math.abs(quotationDiff)) : 0;

  text += `------------------------------------\n`;
  text += `⚖️ *Total New Gold Weight:* ${totalWeight.toFixed(3)} grams\n`;
  if (totalOldGoldGrams > 0) {
    text += `🔄 *Total Old Gold Exchanged:* ${totalOldGoldGrams.toFixed(3)} g (-₹${Math.round(totalOldGoldCredit).toLocaleString('en-IN')})\n`;
  }
  if (totalDeposit > 0) {
    text += `💵 *Total Advance Deposited:* -₹${Math.round(totalDeposit).toLocaleString('en-IN')}\n`;
  }
  text += `🎉 *Making Charge Discount Saved:* ₹${Math.round(totalSavings).toLocaleString('en-IN')}\n`;
  if (quotationRefund > 0) {
    text += `💰 *FINAL NET PAYABLE TOTAL:* *₹0*\n`;
    text += `💚 *CUSTOMER REFUND DUE (EXCESS ADVANCE):* *${inrWholeFormatter.format(quotationRefund)}*\n`;
  } else {
    text += `💰 *FINAL NET PAYABLE TOTAL:* *${inrWholeFormatter.format(quotationPayable)}*\n`;
  }
  text += `------------------------------------\n`;
  text += `_Valid as per today's prevailing gold rates. Malabar Promise of Purity & Transparency._`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Quotation copied to clipboard! Ready to paste into WhatsApp.');
    }).catch(() => {
      prompt('Copy your quotation slip below:', text);
    });
  } else {
    prompt('Copy your quotation slip below:', text);
  }
}

/**
 * Setup print table before printing
 */
function preparePrintQuotation() {
  const dateStr = quotationDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  document.getElementById('print-date').textContent = dateStr;
  document.getElementById('print-rate').textContent = `₹${appState.goldRate.toLocaleString('en-IN')}`;
  document.getElementById('print-rate-18k').textContent = `₹${appState.goldRate18k.toLocaleString('en-IN')}`;
  document.getElementById('print-rate-24k').textContent = `₹${appState.goldRate24k.toLocaleString('en-IN')}`;
  document.getElementById('print-id').textContent = `MGD-${Date.now().toString().slice(-6)}`;

  const printTbody = document.getElementById('print-tbody');
  printTbody.innerHTML = '';

  let totalWeight = 0;
  let totalGold = 0;
  let totalEffMaking = 0;
  let totalStone = 0;
  let totalGst = 0;
  let totalOldGold = 0;
  let totalOldGoldCredit = 0;
  let totalDeposit = 0;
  let grandTotal = 0;

  appState.items.forEach((item, idx) => {
    const calc = calculateItem(item);
    totalWeight += calc.weight;
    totalGold += calc.baseGoldValue;
    totalEffMaking += calc.effectiveMakingRupees;
    totalStone += calc.stoneCharge;
    totalGst += calc.gstRupees;
    totalOldGold += calc.oldGoldWeight;
    totalOldGoldCredit += calc.oldGoldValue;
    totalDeposit += calc.depositAmount;
    grandTotal += calc.finalPrice;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${item.name || `Item ${idx + 1}`}</strong><br><small style="color:#73132B">${calc.itemPurity.toUpperCase()} @ ₹${calc.itemRate.toLocaleString('en-IN')}/g</small></td>
      <td>${calc.weight.toFixed(3)} g</td>
      <td>₹${Math.round(calc.baseGoldValue).toLocaleString('en-IN')}</td>
      <td>${calc.initialMakingPercent}%</td>
      <td>${calc.discountPercent > 0 ? `${calc.discountPercent}%` : '—'}</td>
      <td>₹${Math.round(calc.effectiveMakingRupees).toLocaleString('en-IN')} (${calc.effectiveMakingPercent}%)</td>
      <td>₹${Math.round(calc.stoneCharge).toLocaleString('en-IN')}</td>
      <td>₹${Math.round(calc.gstRupees).toLocaleString('en-IN')}</td>
      <td>${calc.oldGoldWeight > 0 ? `${calc.oldGoldWeight} g (${calc.oldGoldPurity.toUpperCase()})<br><small style="color:#B45309">-₹${Math.round(calc.oldGoldValue).toLocaleString('en-IN')}</small>` : '—'}</td>
      <td>${calc.depositAmount > 0 ? `-₹${Math.round(calc.depositAmount).toLocaleString('en-IN')}` : '—'}</td>
      <td>${calc.refundAmount > 0 ? `<strong>₹0</strong><br><small style="color:#059669; font-weight:700;">Refund: ${inrWholeFormatter.format(calc.refundAmount)}</small>` : `<strong>${inrWholeFormatter.format(calc.finalPrice)}</strong>`}</td>
    `;
    printTbody.appendChild(row);
  });

  const totalGrossPrint = round2(totalGold + totalEffMaking + totalStone + totalGst);
  const totalCreditsPrint = round2(totalOldGoldCredit + totalDeposit);
  const printDiff = round2(totalGrossPrint - totalCreditsPrint);
  const printPayable = printDiff > 0 ? printDiff : 0;
  const printRefund = printDiff < 0 ? round2(Math.abs(printDiff)) : 0;

  const printTfoot = document.getElementById('print-tfoot');
  printTfoot.innerHTML = `
    <tr>
      <td><strong>${appState.items.length === 1 ? 'Item 1 Total' : 'TOTAL'}</strong></td>
      <td><strong>${totalWeight.toFixed(3)} g</strong></td>
      <td><strong>${inrWholeFormatter.format(totalGold)}</strong></td>
      <td>—</td>
      <td>—</td>
      <td><strong>₹${Math.round(totalEffMaking).toLocaleString('en-IN')}</strong></td>
      <td><strong>₹${Math.round(totalStone).toLocaleString('en-IN')}</strong></td>
      <td><strong>₹${Math.round(totalGst).toLocaleString('en-IN')}</strong></td>
      <td><strong>${totalOldGold > 0 ? `${totalOldGold.toFixed(3)} g (-₹${Math.round(totalOldGoldCredit).toLocaleString('en-IN')})` : '—'}</strong></td>
      <td><strong>${totalDeposit > 0 ? `-₹${Math.round(totalDeposit).toLocaleString('en-IN')}` : '—'}</strong></td>
      <td style="font-size:1.1rem; color:#73132B;">${printRefund > 0 ? `<strong>₹0</strong><br><small style="color:#059669; font-weight:bold;">Refund: ${inrWholeFormatter.format(printRefund)}</small>` : `<strong>${inrWholeFormatter.format(printPayable)}</strong>`}</td>
    </tr>
  `;

  window.print();
}

/**
 * Toast notification
 */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/**
 * Safe HTML string escape
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * LocalStorage Helpers
 */
const STORAGE_KEY = 'malabar_calculator_state_v6';

function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    // ignore
  }
}

function loadStateFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        appState.goldRate = Number(parsed.goldRate) || 7450;
        appState.items = parsed.items.map((it, idx) => ({
          id: it.id || `item-${idx + 1}`,
          name: it.name || `Item ${idx + 1}`,
          purity: it.purity || '22k',
          weight: it.weight !== undefined && it.weight !== null ? String(it.weight) : '',
          makingCharge: it.makingCharge !== undefined && it.makingCharge !== null ? String(it.makingCharge) : '',
          stoneCharge: it.stoneCharge !== undefined && it.stoneCharge !== null ? String(it.stoneCharge) : '0',
          discount: it.discount !== undefined && it.discount !== null ? String(it.discount) : '',
          oldGold: it.oldGold !== undefined && it.oldGold !== null ? String(it.oldGold) : '',
          oldGoldPurity: it.oldGoldPurity || '22k',
          deposit: it.deposit !== undefined && it.deposit !== null ? String(it.deposit) : '',
          gst: it.gst !== undefined ? it.gst : 3
        }));
      }
    }
  } catch (e) {
    // ignore
  }
}

// Active Selected / Live Date Management
let quotationDate = new Date();
let isCustomQuotationDate = false;

function isSameCalendarDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatDateLabel(d) {
  const isToday = isSameCalendarDay(d, new Date());
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const str = d.toLocaleDateString('en-IN', options);
  return isToday ? `Today: ${str}` : `Date: ${str}`;
}

function updateDateDisplay() {
  const displayEl = document.getElementById('live-date-display');
  const resetBtn = document.getElementById('btn-today-reset');
  const datePickerInput = document.getElementById('date-picker-input');

  if (displayEl) {
    displayEl.textContent = formatDateLabel(quotationDate);
  }

  if (resetBtn) {
    resetBtn.classList.toggle('hidden', !isCustomQuotationDate);
  }

  if (datePickerInput) {
    const yyyy = quotationDate.getFullYear();
    const mm = String(quotationDate.getMonth() + 1).padStart(2, '0');
    const dd = String(quotationDate.getDate()).padStart(2, '0');
    datePickerInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Initialize event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load saved state or default
  loadStateFromStorage();

  // Initialize and display live date
  quotationDate = new Date();
  isCustomQuotationDate = false;
  updateDateDisplay();

  // Auto-update date dynamically as day changes / rolls past midnight
  setInterval(() => {
    if (!isCustomQuotationDate) {
      const now = new Date();
      if (!isSameCalendarDay(quotationDate, now)) {
        quotationDate = now;
        updateDateDisplay();
      }
    }
  }, 30000); // Checks every 30 seconds

  // Date picker & custom date selection
  const datePicker = document.getElementById('date-picker-input');
  const dateTrigger = document.getElementById('live-date-trigger');
  const resetDateBtn = document.getElementById('btn-today-reset');

  function openCalendar() {
    if (!datePicker) return;
    try {
      if (typeof datePicker.showPicker === 'function') {
        datePicker.showPicker();
        return;
      }
    } catch (err) {
      console.warn('showPicker error:', err);
    }
    // Fallback for older browsers
    const userDate = prompt('Enter quotation date (YYYY-MM-DD):', datePicker.value);
    if (userDate && /^\d{4}-\d{2}-\d{2}$/.test(userDate)) {
      datePicker.value = userDate;
      datePicker.dispatchEvent(new Event('change'));
    }
  }

  if (dateTrigger) {
    dateTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCalendar();
    });
  }

  if (datePicker) {
    datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        const parts = e.target.value.split('-');
        quotationDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        isCustomQuotationDate = !isSameCalendarDay(quotationDate, new Date());
        updateDateDisplay();
        showToast(`Quotation date set to ${formatDateLabel(quotationDate)}`);
      }
    });
  }

  if (resetDateBtn) {
    resetDateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      quotationDate = new Date();
      isCustomQuotationDate = false;
      updateDateDisplay();
      showToast("Reset to Today's Live Date");
    });
  }

  // Initialize gold rate input
  const goldRateInput = document.getElementById('gold-rate-input');
  goldRateInput.value = appState.goldRate;

  // Gold rate input reacts immediately without losing focus, updating 24k and 18k automatically
  const handleGoldRateInput = (e) => {
    const val = parseFloat(e.target.value);
    appState.goldRate = isNaN(val) ? 0 : val;
    updateCalculations();
  };

  goldRateInput.addEventListener('input', handleGoldRateInput);
  goldRateInput.addEventListener('change', handleGoldRateInput);
  goldRateInput.addEventListener('keyup', handleGoldRateInput);

  // Table input event delegation (instant reactive calculations on typing)
  const tbody = document.getElementById('items-tbody');
  tbody.addEventListener('input', handleTableInput);

  // Table select change delegation (purity change, old gold purity change)
  tbody.addEventListener('change', handleTableSelectChange);

  // Table button action delegation (delete, duplicate, breakdown)
  tbody.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const id = actionBtn.dataset.id;
      if (action === 'delete') deleteItem(id);
      if (action === 'duplicate') duplicateItem(id);
      return;
    }

    const breakdownBtn = e.target.closest('[data-breakdown-id]');
    if (breakdownBtn) {
      const id = breakdownBtn.dataset.breakdownId;
      showItemBreakdown(id);
    }
  });

  // Add Item button
  document.getElementById('btn-add-item').addEventListener('click', () => addNewItem());

  // Quick preset add buttons
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = {
        name: btn.dataset.name,
        purity: btn.dataset.purity || '22k',
        weight: btn.dataset.weight,
        making: btn.dataset.making,
        discount: btn.dataset.discount,
        stone: btn.dataset.stone,
        oldGold: '',
        oldGoldPurity: btn.dataset.purity || '22k',
        deposit: ''
      };
      addNewItem(preset);
    });
  });

  // Reset table directly to 1 default row (Item 1) without popup
  document.getElementById('btn-reset-sample').addEventListener('click', () => {
    appState.items = getDefaultInitialItems();
    renderTableStructure();
    showToast('Reset table to 1 default item (Item 1)');
  });

  // Print buttons
  document.getElementById('btn-print').addEventListener('click', preparePrintQuotation);
  document.getElementById('btn-sticky-print').addEventListener('click', preparePrintQuotation);

  // WhatsApp / Share buttons
  document.getElementById('btn-copy-summary').addEventListener('click', shareWhatsAppQuotation);
  document.getElementById('btn-sticky-whatsapp').addEventListener('click', shareWhatsAppQuotation);

  // Modal close handlers
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    document.getElementById('breakdown-modal').classList.add('hidden');
  });

  document.getElementById('breakdown-modal').addEventListener('click', (e) => {
    if (e.target.id === 'breakdown-modal') {
      document.getElementById('breakdown-modal').classList.add('hidden');
    }
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('breakdown-modal').classList.add('hidden');
    }
  });

  // Initial build of table DOM structure
  renderTableStructure();
});
