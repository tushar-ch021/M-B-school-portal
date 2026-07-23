import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Helper utility that returns a promise resolving once all image elements 
 * within the target element have fully loaded and decoded.
 * @param {HTMLElement} element The target container element.
 */
const waitForImages = async (element) => {
  const images = Array.from(element.getElementsByTagName('img'));
  const promises = images.map((img) => {
    // If the image is already loaded and complete, decode it
    if (img.complete) {
      if (img.decode) {
        return img.decode().catch((err) => {
          console.warn('Preloaded image decoding failed for:', img.src, err);
        });
      }
      return Promise.resolve();
    }

    // Otherwise, wait for load/error and decode
    return new Promise((resolve) => {
      const handleLoad = () => {
        if (img.decode) {
          img.decode()
            .then(resolve)
            .catch((err) => {
              console.warn('Lazy image decoding failed for:', img.src, err);
              resolve();
            });
        } else {
          resolve();
        }
      };

      img.addEventListener('load', handleLoad, { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  });

  await Promise.all(promises);
};

/**
 * Helper utility that detects elements with a CSS background-image set,
 * extracts the URL, and preloads each one via Image() before resolving.
 * @param {HTMLElement} element The target container element.
 */
const waitForBackgroundImages = async (element) => {
  const allElements = Array.from(element.querySelectorAll('*'));
  allElements.push(element);
  const bgImagePromises = [];

  allElements.forEach((el) => {
    const bgImage = window.getComputedStyle(el).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const matches = bgImage.match(/url\((['"]?)(.*?)\1\)/g);
      if (matches) {
        matches.forEach((match) => {
          const url = match.replace(/^url\((['"]?)(.*?)\1\)$/, '$2');
          if (url && !url.startsWith('data:')) {
            bgImagePromises.push(
              new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                if (img.complete) {
                  resolve();
                } else {
                  img.onload = resolve;
                  img.onerror = resolve;
                }
              })
            );
          }
        });
      }
    }
  });

  await Promise.all(bgImagePromises);
};

/**
 * Captures an HTML element and triggers a browser PDF download.
 * @param {HTMLElement} element The target DOM node to render.
 * @param {string} filename The output file name.
 * @param {Object} options Configuration parameters.
 * @param {boolean} options.useA4 If true, forces standard A4 page mapping. If false, fits PDF bounds exactly to element dimensions (best for ID cards).
 * @param {number} options.captureWidth Explicit width in pixels to force the clone to render at (prevents mobile/responsive squishing).
 */
export const downloadPDF = async (element, filename = 'document.pdf', options = {}) => {
  if (!element) {
    console.error('PDF Generation Error: Target element is empty.');
    return;
  }

  const { useA4 = true, captureWidth } = options;

  try {
    // 1. Wait for <img> elements, CSS background-images, and web fonts to be completely ready before capture
    await Promise.all([
      waitForImages(element),
      waitForBackgroundImages(element),
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
    ]);

    // 3. Determine target virtual viewport width
    const targetWidth = captureWidth || (useA4 ? 800 : 324);
    
    // 4. Generate canvas with optimized options for precise layout rendering
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution scale 2
      useCORS: true, // Handle cross-origin assets
      allowTaint: false, // Prevent tainted canvas context
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: targetWidth + 100,
      onclone: (clonedDoc) => {
        // Copy all parent stylesheets into cloned document
        const parentStylesheets = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
        parentStylesheets.forEach((styleNode) => {
          clonedDoc.head.appendChild(styleNode.cloneNode(true));
        });

        // Inject font baseline & line-height normalization to fix html2canvas text vertical alignment bug
        const fixStyles = clonedDoc.createElement('style');
        fixStyles.innerHTML = `
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          .print-container,
          .print-container * {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          /* Preserve each template's authored line-height. A forced line-height
             changes row dimensions and leaves visible space below document text. */
          .print-container td,
          .print-container th {
            vertical-align: middle !important;
          }
          .print-container p {
            margin-top: 0;
            margin-bottom: 0;
          }
          /* Guarantee bottom padding on the identity card blue banner strip in PDF exports */
          .identity-strip {
            padding-bottom: 6px !important;
            padding-top: 2px !important;
            height: 27px !important;
            min-height: 27px !important;
            box-sizing: border-box !important;
          }
          .identity-strip span {
            padding-bottom: 3px !important;
            line-height: 1 !important;
            display: inline-block !important;
          }
        `;
        clonedDoc.head.appendChild(fixStyles);

        const container = clonedDoc.querySelector('.print-container') || clonedDoc.getElementById(element.id);
        if (container) {
          container.style.width = `${targetWidth}px`;
          container.style.minWidth = `${targetWidth}px`;
          container.style.maxWidth = `${targetWidth}px`;
          container.style.transform = 'none';
          container.style.margin = '0 auto';
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');

    // Convert canvas pixels to mm (standard CSS screen density ratio ~0.264583 mm per pixel)
    const mmRatio = 0.264583 / 2;
    let imgWidthMm = canvas.width * mmRatio;
    let imgHeightMm = canvas.height * mmRatio;

    let pdf;

    if (useA4) {
      pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;

      // Scale height to fit the standard A4 width aspect ratio
      const scaleFactor = pageWidth / imgWidthMm;
      const finalWidth = pageWidth;
      const finalHeight = imgHeightMm * scaleFactor;

      let heightLeft = finalHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight);
      heightLeft -= pageHeight;

      // Add extra pages if content overflows standard A4 height
      while (heightLeft > 0) {
        position = heightLeft - finalHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight);
        heightLeft -= pageHeight;
      }
    } else {
      // Exact element dimension fitting (Ideal for ID cards)
      pdf = new jsPDF({
        orientation: imgWidthMm > imgHeightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [imgWidthMm, imgHeightMm]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  }
};
