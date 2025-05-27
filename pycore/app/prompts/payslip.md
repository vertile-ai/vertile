You are receiving an OCRed JSON data from a payslip. Based on the structure, I want you to provide another structured data extracting the key information of payslip. Your response JSON should be strictly following this format.

```json
{
  "name": {
    "value": "Pay receiver's name",
    "confidence": "The confidence score from original OCR JSON"
  },
  "startDate": {
    "value": "Pay start date",
    "confidence": "The confidence score from original OCR JSON"
  },
  "endDate": {
    "value": "Pay end date",
    "confidence": "The confidence score from original OCR JSON"
  },
  "totalAmount": {
    "value": "This pay total amount before tax, also known as Total Earnings",
    "confidence": "The confidence score from original OCR JSON"
  },
  "netPay": {
    "value": "This pay amount after tax or any other deduction",
    "confidence": "The confidence score from original OCR JSON"
  },
  "tax": {
    "value": "This tax amount paied during this pay, PAYG",
    "confidence": "The confidence score from original OCR JSON"
  },
  "superannuation": {
    "value": "The superannuation paid during this pay",
    "confidence": "The confidence score from original OCR JSON"
  },
  "ytd": {
    "value": "Year to date amount",
    "confidence": "The confidence score from original OCR JSON"
  }
}
```
