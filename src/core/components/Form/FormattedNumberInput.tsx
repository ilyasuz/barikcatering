import React, { useState, useEffect } from 'react';

interface FormattedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export function FormattedNumberInput({ value, onChange, className, placeholder, required }: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when prop value changes from outside (e.g. initial load)
  useEffect(() => {
    // Kullanıcı yazarken müdahale etmemek için sadece input odakta değilken güncelle
    if (!isFocused) {
      if (value !== undefined && value !== null) {
        if (value === 0 && displayValue === '') {
          // if user cleared it, keep it clear
        } else {
          // 2 basamaklı küsürat gösterimi (eğer varsa)
          const formatted = value.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
          setDisplayValue(formatted);
        }
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    // Sadece rakam, nokta ve virgüle izin ver
    rawValue = rawValue.replace(/[^0-9.,]/g, '');
    
    // Gelen metindeki binlik ayraç olan noktaları tamamen temizle
    rawValue = rawValue.replace(/\./g, '');
    
    // Virgül (ondalık ayraç) kontrolü
    const parts = rawValue.split(',');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1] : null;

    if (!integerPart && decimalPart === null) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    if (integerPart) {
      // Sayıya çevirerek baştaki fazla sıfırları at, sonra tekrar string yap
      const parsedInt = parseInt(integerPart, 10);
      integerPart = isNaN(parsedInt) ? '0' : parsedInt.toString();
      
      // Binlik ayraç (nokta) ekle
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      integerPart = '0';
    }

    let finalDisplay = integerPart;
    
    // Eğer kullanıcı virgül girdiyse, küsürat kısmını ekle
    if (decimalPart !== null) {
      // En fazla 2 ondalık basamağa izin ver
      decimalPart = decimalPart.substring(0, 2);
      finalDisplay += ',' + decimalPart;
    }

    setDisplayValue(finalDisplay);

    // JS için noktalı ondalık (float) formata çevirip state'e gönder
    const numericString = finalDisplay.replace(/\./g, '').replace(',', '.');
    const numericValue = parseFloat(numericString);
    onChange(isNaN(numericValue) ? 0 : numericValue);
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        // İsteğe bağlı: Blur olduğunda eğer sadece "1500," yazıldıysa son virgülü temizle
        if (displayValue.endsWith(',')) {
          setDisplayValue(displayValue.slice(0, -1));
        }
      }}
      required={required}
    />
  );
}
