/**
 * Native Browser Print Utility (React 19 Compatible)
 * Prints any DOM element inside a temporary hidden iframe without external package dependencies.
 *
 * Fixes: First-time print showing blank/unstyled content by waiting for all
 * stylesheets and fonts to fully load before invoking the browser print dialog.
 */
export const printElement = (element, title = 'Print Document') => {
  if (!element) {
    console.warn('printElement: Target element is null or unmounted');
    return;
  }

  // Create temporary hidden printing iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.title = title;

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;

  // Clone document style sheets and Tailwind CSS definitions
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${headStyles}
        <style>
          @media print {
            @page {
              size: auto;
              margin: 5mm;
            }
            html, body { 
              background: #ffffff !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important;
              height: 100% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-wrapper {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              box-sizing: border-box !important;
            }
            .identity-card-container {
              width: 324px !important;
              height: 516px !important;
              min-width: 324px !important;
              min-height: 516px !important;
              max-width: 324px !important;
              max-height: 516px !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .no-print { display: none !important; }
          }
          body {
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          .print-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            min-height: 95vh;
          }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  /**
   * Wait for all linked stylesheets inside the iframe to finish loading,
   * then wait for web fonts to be ready, and finally trigger print.
   * This prevents the "blank first print" issue where styles haven't
   * been applied when the print dialog opens too early.
   */
  const waitForStylesAndFonts = async () => {
    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframeWindow.document;

    // 1. Collect all stylesheet <link> elements in the iframe and wait for each to load
    const stylesheetLinks = Array.from(iframeDocument.querySelectorAll('link[rel="stylesheet"]'));
    const stylesheetLoadPromises = stylesheetLinks.map((link) => {
      // Do not inspect `link.sheet.cssRules`: browsers block that property for
      // cross-origin stylesheets (including CDN fonts), even when the sheet has
      // loaded successfully. The link's load/error events are sufficient here.
      return new Promise((resolve) => {
        link.addEventListener('load', resolve, { once: true });
        link.addEventListener('error', resolve, { once: true });

        // A cached sheet can already be complete before listeners are attached.
        // `sheet` itself is safe to read; avoid cssRules because it can throw.
        if (link.sheet) resolve();
      });
    });
    await Promise.all(stylesheetLoadPromises);

    // 2. Wait for fonts to be ready (if supported)
    if (iframeDocument.fonts && iframeDocument.fonts.ready) {
      try {
        await iframeDocument.fonts.ready;
      } catch (e) {
        // Non-critical, proceed to print
      }
    }

    // 3. Wait for images to decode if any
    const images = Array.from(iframeDocument.getElementsByTagName('img'));
    const imagePromises = images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });
    await Promise.all(imagePromises);

    // 4. Small final settle delay to ensure browser layout is fully computed
    await new Promise((r) => setTimeout(r, 150));
  };

  // Use the iframe's native load event as the starting point, then additionally
  // wait for styles, fonts, and images. This is much more reliable than a raw setTimeout.
  iframe.addEventListener('load', async () => {
    try {
      await waitForStylesAndFonts();
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Failed to trigger browser print dialog:', e);
    } finally {
      // Keep iframe alive longer so the print dialog can finish rendering.
      // Removing too early causes the print preview to go blank.
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  });
};

export default printElement;
