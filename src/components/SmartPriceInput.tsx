import { useState, useEffect } from 'react';
import type { CurrencyCode } from '../types';

interface SmartPriceInputProps {
  value: number;
  onChange: (val: number) => void;
  currency: CurrencyCode;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: string;
}

/**
 * A controlled component that replaces `<input type="number">` on mobile.
 * Features:
 *  - Uses `type="text" inputMode="decimal"` for optimal native numeric keyboards.
 *  - On focus, shows bare unformatted numerals for clear editing.
 *  - On blur, auto-formats visually to `toLocaleString('en-US')` ONLY when appropriate
 *    (e.g., IQD 0 decimal formatting to `3,300`).
 *  - Kilo-logic: For IQD, entering any decimal string (e.g. "3.3") OR small values like "250"
 *    smartly multiplies by 1000 so the user isn't forced to type zeroes. 
 */
export default function SmartPriceInput({
  value,
  onChange,
  currency,
  className = '',
  placeholder,
}: SmartPriceInputProps) {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState('');

  // Sync prop -> local visual state whenever focus changes or upstream value changes
  useEffect(() => {
    if (!focused) {
      if (value === 0) {
        setInternalValue('');
      } else if (currency === 'IQD') {
        // IQD format cleanly slices off decimals naturally due to our decimals: 0 in metadata,
        // and strictly handles commas
        setInternalValue(value.toLocaleString('en-US'));
      } else {
        // BHD/others show their rigid decimal scales naturally
        setInternalValue(value.toString());
      }
    }
  }, [value, currency, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={focused ? internalValue : (value === 0 ? '' : (currency === 'IQD' ? value.toLocaleString('en-US') : value.toString()))}
      onFocus={() => {
        setFocused(true);
        // Expose raw integer/float so user can easily backspace and edit without battling commas
        setInternalValue(value === 0 ? '' : value.toString());
      }}
      onBlur={() => {
        setFocused(false);
        const raw = internalValue.replace(/,/g, '');
        let parsed = parseFloat(raw);
        if (isNaN(parsed)) parsed = 0;

        if (currency === 'IQD' && raw !== '') {
          // Kilo-Logic Implementation:
          // Typing explicit decimal point '3.3' => 3300
          // Typing shorthand small integer '250' => 250000 
          // Re-focusing an already inflated '250000' will bypass this loop safely.
             if (raw.includes('.') || (parsed !== 0 && Math.abs(parsed) < 1000)) {
               parsed = Math.round(parsed * 1000);
             }
        }

        onChange(parsed);
      }}
      onChange={(e) => {
        // Validate and allow numbers/decimals (and optionally commas if pasted)
        setInternalValue(e.target.value);
      }}
    />
  );
}
