import QRCode from 'qrcode';

export async function generateQRDataUrl(text) {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
}

export function downloadQR(dataUrl, filename = 'qr-code.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printQR(dataUrl, productName, price) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html dir="rtl">
      <head>
        <title>QR Code - ${productName}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; text-align: center; }
          .container { max-width: 400px; padding: 40px; }
          img { width: 100%; max-width: 300px; height: auto; }
          h2 { margin: 16px 0 8px; font-size: 20px; color: #0f172a; }
          .price { font-size: 24px; font-weight: bold; color: #2563eb; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${dataUrl}" alt="QR Code" />
          <h2>${productName}</h2>
          <div class="price">${price}</div>
        </div>
        <script>window.print();window.close();<\/script>
      </body>
    </html>
  `);
  win.document.close();
}
