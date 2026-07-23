/**
 * Converts a numerical amount into corresponding words in Indian numbering system (Lakhs/Crores).
 * @param {number} num The input amount.
 * @returns {string} The words representation.
 */
export const amountInWords = (num) => {
  if (num === undefined || num === null || isNaN(num)) return 'Zero';
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + amountInWords(Math.abs(num));
  
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (val) => {
    let output = '';
    if (val >= 100) {
      output += ones[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val > 0) {
      if (output !== '') {
        output += 'and ';
      }
      if (val < 20) {
        output += ones[val] + ' ';
      } else {
        output += tens[Math.floor(val / 10)] + ' ';
        if (val % 10 > 0) {
          output += ones[val % 10] + ' ';
        }
      }
    }
    return output.trim();
  };

  let numVal = Math.floor(num);
  let words = '';
  
  // Handlers for Indian place value scales
  if (numVal < 1000) {
    words = convertHundreds(numVal);
  } else {
    // 1. Hundreds part (last 3 digits)
    const hundredsPart = numVal % 1000;
    if (hundredsPart > 0) {
      words = convertHundreds(hundredsPart);
    }
    numVal = Math.floor(numVal / 1000);
    
    // Scales: Thousands, Lakhs, Crores
    const scales = ['Thousand', 'Lakh', 'Crore'];
    let scaleIdx = 0;
    
    while (numVal > 0) {
      // Split by 100 in Indian system
      const segment = numVal % 100;
      if (segment > 0) {
        const text = convertHundreds(segment) + ' ' + scales[scaleIdx] + ' ';
        words = text + words;
      }
      numVal = Math.floor(numVal / 100);
      scaleIdx++;
    }
  }
  
  return words.trim();
};
