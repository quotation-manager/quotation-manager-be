const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const { uploadFile, deleteImage, getImageUrl } = require('./s3Service');
const { COMPANY_INFO, PRICE_TYPES } = require('../utils/constants');
const https = require('https');

/**
 * PDF Generation Service for Quotations
 * Uses jsPDF for creating professional PDF documents
 */

/**
 * Load letterhead image from assets folder and convert to base64
 * @returns {Promise<string>} - Base64 encoded letterhead image
 */
const loadLetterheadImage = async () => {
  try {
    const letterheadPath = path.join(__dirname, '../assets/Tulip_Letter_Head.jpg');
    const imageBuffer = fs.readFileSync(letterheadPath);
    const base64 = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error loading letterhead image:', error);
    return null;
  }
};

/**
 * Download image from S3 URL and convert to base64
 * @param {string} imagePath - S3 path of the image
 * @returns {Promise<{base64: string, width: number, height: number}>} - Base64 encoded image with dimensions
 */
const downloadImageAsBase64 = async imagePath => {
  return new Promise((resolve, reject) => {
    const imageUrl = getImageUrl(imagePath);

    https
      .get(imageUrl, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const mimeType = response.headers['content-type'] || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${base64}`;

          // Get image dimensions using a simple approach
          // For JPEG/PNG, we can read the header to get dimensions
          let width = 800; // Default width
          let height = 600; // Default height

          try {
            // Simple dimension detection for common formats
            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
              // For JPEG, read dimensions from header
              if (buffer.length > 20) {
                let i = 2;
                while (i < buffer.length - 2) {
                  if (buffer[i] === 0xff && buffer[i + 1] === 0xc0) {
                    height = (buffer[i + 5] << 8) | buffer[i + 6];
                    width = (buffer[i + 7] << 8) | buffer[i + 8];
                    break;
                  }
                  i++;
                }
              }
            } else if (mimeType.includes('png')) {
              // For PNG, read dimensions from header
              if (buffer.length > 24) {
                width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
                height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
              }
            }
          } catch (error) {
            console.warn('Could not detect image dimensions, using defaults:', error.message);
          }

          resolve({ base64: dataUrl, width, height });
        });
      })
      .on('error', error => {
        console.error('Error downloading image:', error);
        reject(error);
      });
  });
};

/**
 * Calculate optimal image dimensions for PDF
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {Object} - Calculated width and height
 */
const calculateOptimalDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  // Create a smaller square format
  const squareSize = 50; // Reduced from 80mm to 50mm for smaller images

  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  let width, height;

  if (aspectRatio > 1) {
    // Landscape image - fit to square height
    height = squareSize;
    width = squareSize * aspectRatio;

    // If width exceeds square size, scale down proportionally
    if (width > squareSize) {
      width = squareSize;
      height = squareSize / aspectRatio;
    }
  } else {
    // Portrait or square image - fit to square width
    width = squareSize;
    height = squareSize / aspectRatio;

    // If height exceeds square size, scale down proportionally
    if (height > squareSize) {
      height = squareSize;
      width = squareSize * aspectRatio;
    }
  }

  return { width, height };
};

/**
 * Add images to PDF with proper sizing and layout
 * @param {Object} doc - jsPDF document instance
 * @param {Array} images - Array of image paths
 * @param {number} startY - Starting Y position
 * @param {number} margin - Page margin
 * @param {number} pageWidth - Page width
 * @returns {number} - New Y position after adding images
 */
const addImagesToPDF = async (doc, images, startY, margin, pageWidth) => {
  if (!images || images.length === 0) return startY;

  const squareSize = 50; // Reduced from 80mm to 50mm
  const imagesPerRow = 3; // Increased to 3 images per row since they're smaller
  const imageSpacing = 8; // Reduced spacing since images are smaller
  const rowSpacing = 10; // Reduced row spacing
  let currentY = startY;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Images:', margin, currentY);
  currentY += 15; // Reduced space after label

  // Calculate available width for images
  const availableWidth = pageWidth - margin * 2;
  const totalImageWidth = squareSize * imagesPerRow + imageSpacing * (imagesPerRow - 1);
  const startX = margin + (availableWidth - totalImageWidth) / 2; // Center the images

  // Calculate how many rows we'll need
  const totalRows = Math.ceil(images.length / imagesPerRow);
  const totalHeightNeeded = totalRows * (squareSize + rowSpacing) - rowSpacing;

  // Check if we need a new page for the entire image section
  if (currentY + totalHeightNeeded > doc.internal.pageSize.getHeight() - margin - 30) {
    doc.addPage();
    currentY = margin;
  }

  for (let i = 0; i < images.length; i++) {
    try {
      const imagePath = images[i];
      const {
        base64: base64Image,
        width: originalWidth,
        height: originalHeight,
      } = await downloadImageAsBase64(imagePath);

      // Calculate optimal dimensions (will be close to square)
      const { width: imgWidth, height: imgHeight } = calculateOptimalDimensions(
        originalWidth,
        originalHeight,
        squareSize,
        squareSize
      );

      // Calculate position for this image
      const row = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      const x = startX + col * (squareSize + imageSpacing);
      const y = currentY + row * (squareSize + rowSpacing);

      // Add image to PDF
      doc.addImage(base64Image, 'JPEG', x, y, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error processing image:', error);
      // Add placeholder text for failed image
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text(`Image ${i + 1}: Failed to load`, margin, currentY);
      currentY += 15; // Reduced space for failed image
    }
  }

  // Calculate final Y position
  const finalY = currentY + totalRows * (squareSize + rowSpacing) - rowSpacing;

  return finalY;
};

/**
 * Generate PDF for a quotation matching the provided format
 * @param {Object} quotation - Quotation data with items and customer
 * @param {string} quotationId - Quotation ID for file naming
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateQuotationPDF = async (quotation, quotationId) => {
  try {
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    let yPosition = margin;

    // === HEADER SECTION ===
    await addPDFHeader(doc, quotation, pageWidth, margin, yPosition);
    yPosition = margin + 35 + 5; // margin + letterhead height + small spacing

    // === CUSTOMER INFO SECTION ===
    yPosition = addCustomerInfo(doc, quotation, margin, pageWidth, yPosition);
    yPosition += 5;

    // === ITEMS TABLE ===
    yPosition = await addItemsTable(doc, quotation, margin, pageWidth, pageHeight, yPosition);

    // === FOOTER SECTION (includes remarks if present) ===
    addPDFFooter(doc, pageWidth, pageHeight, margin, quotation, yPosition);

    // Return PDF as buffer
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Add header section with company info and branding
 */
const addPDFHeader = async (doc, quotation, pageWidth, margin, yPosition) => {
  // Load and add letterhead image
  const letterheadBase64 = await loadLetterheadImage();
  const contentWidth = pageWidth - margin * 2;

  if (letterheadBase64) {
    try {
      // Add letterhead image with proper content width alignment and reduced height
      const letterheadHeight = 35; // Reduced height to match content better
      doc.addImage(letterheadBase64, 'JPEG', margin, yPosition, contentWidth, letterheadHeight);
    } catch (error) {
      console.error('Error adding letterhead image to PDF:', error);
      // Fallback to original red header if image fails
      doc.setFillColor(220, 20, 20);
      doc.rect(margin, yPosition, contentWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('QUOTATION', pageWidth / 2, yPosition + 15, { align: 'center' });
    }
  } else {
    // Fallback to original red header if letterhead image is not available
    doc.setFillColor(220, 20, 20);
    doc.rect(margin, yPosition, contentWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth / 2, yPosition + 15, { align: 'center' });
  }
};

/**
 * Add customer information section
 */
const addCustomerInfo = (doc, quotation, margin, pageWidth, yPosition) => {
  // Customer details section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let currentY = yPosition;

  // Left side - To section
  doc.setFont('helvetica', 'bold');
  doc.text('To:', margin, currentY);
  currentY += 5;

  // Name - with text wrapping for long names
  doc.setFont('helvetica', 'normal');
  doc.text('Name:', margin, currentY);
  const customerName = quotation.customer?.name || 'N/A';
  const maxNameWidth = pageWidth / 2 - margin - 30; // Leave space for right side content
  const nameLines = doc.splitTextToSize(customerName, maxNameWidth);

  let nameY = currentY;
  nameLines.forEach((line, index) => {
    doc.text(line, margin + 15, nameY);
    if (index < nameLines.length - 1) {
      nameY += 4; // Line spacing for multi-line names
    }
  });
  currentY = nameY + 5;

  // Address - handle multi-line addresses
  doc.text('Address:', margin, currentY);
  const address = quotation.customer?.address || 'N/A';
  const maxAddressWidth = pageWidth / 2 - margin - 30; // Leave space for right side content
  const addressLines = doc.splitTextToSize(address, maxAddressWidth);

  let addressY = currentY;
  addressLines.forEach((line, index) => {
    doc.text(line, margin + 20, addressY);
    if (index < addressLines.length - 1) {
      addressY += 4; // Line spacing for multi-line addresses
    }
  });
  currentY = addressY + 5;

  // Mobile - positioned after address regardless of address length
  doc.text('Mobile:', margin, currentY);
  doc.text(quotation.customer?.mobile_no || 'N/A', margin + 20, currentY);
  currentY += 5;

  // GST Number - positioned after mobile
  doc.text('GST Number:', margin, currentY);
  doc.text(quotation.customer?.gst_number || 'N/A', margin + 25, currentY);
  currentY += 5;

  // Right side - Quote details (restructured for better layout)
  const labelX = pageWidth - 100; // Position for labels (100mm from right edge)
  const valueX = pageWidth - margin - 25; // Position for values (25mm from right edge)
  let rightY = yPosition;

  // Quote ID section with separate positioning for labels and values
  doc.setFont('helvetica', 'normal');
  doc.text('Quote Id:', labelX, rightY);
  doc.text(quotation.id, valueX, rightY + 4, { align: 'right' });
  rightY += 9;

  doc.text('Date:', labelX, rightY);
  doc.text(new Date(quotation.quotation_date).toLocaleDateString('en-IN'), valueX, rightY, {
    align: 'right',
  });
  rightY += 5;

  // Reference details with proper spacing
  const referenceName = quotation.customer?.reference?.name || '';
  const referenceMobile = quotation.customer?.reference?.mobile_no || '';

  // Reference Name - with proper text wrapping and positioning
  doc.text('Reference Name:', labelX, rightY);

  // Calculate available width for reference name (from label end to right margin)
  const labelWidth = doc.getTextWidth('Reference Name:');
  const availableWidth = valueX - (labelX + labelWidth + 5); // 5mm gap between label and value

  // Split text to fit available width
  const refNameLines = doc.splitTextToSize(referenceName, availableWidth);

  // Position reference name after the label
  let refNameY = rightY;
  refNameLines.forEach((line, index) => {
    doc.text(line, labelX + labelWidth + 5, refNameY);
    if (index < refNameLines.length - 1) {
      refNameY += 4; // Line spacing for multi-line reference names
    }
  });

  // Update Y position based on number of lines
  rightY = refNameY + 5;

  // Reference Mobile
  doc.text('Reference Mobile:', labelX, rightY);

  doc.text(referenceMobile, valueX, rightY, { align: 'right' });
  rightY += 5;

  // Return the maximum Y position to ensure proper spacing for next section
  // Add extra spacing if we have multi-line content to prevent overlap
  const maxY = Math.max(currentY, rightY);
  const extraSpacing = nameLines.length > 1 || refNameLines.length > 1 ? 10 : 5;
  return maxY + extraSpacing;
};

/**
 * Get column alignment based on column index
 */
const getColumnAlignment = colIndex => {
  // Column alignments: 0=Sr, 1=Product, 2=Location, 3=Rate, 4=Unit, 5=Qty, 6=Discount, 7=Image
  const alignments = ['center', 'left', 'left', 'right', 'center', 'center', 'center', 'center'];
  return alignments[colIndex] || 'left';
};

/**
 * Get maximum characters for column before wrapping
 */
const getMaxCharsForColumn = colIndex => {
  // Character limits based on column width and content type (not used anymore but kept for reference)
  const limits = [3, 20, 15, 12, 8, 5, 3, 8, 8, 0]; // 0 for image column
  return limits[colIndex] || 10;
};

/**
 * Add items table with all database fields
 */
const addItemsTable = async (doc, quotation, margin, pageWidth, pageHeight, startY) => {
  if (!quotation.items || quotation.items.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('No items in this quotation', margin, startY);
    return startY + 20;
  }

  let yPosition = startY;
  const tableWidth = pageWidth - margin * 2;
  const rowHeight = 25; // Increased from 20 to accommodate text wrapping
  const headerHeight = 15;

  // Table headers
  const headers = ['Sr', 'Product', 'Location', 'Rate', 'Unit', 'Qty', 'Discount', 'Image'];
  // Adjusted column widths to fit within page (total should be around 190mm for A4)
  const colWidths = [12, 50, 26, 18, 16, 12, 18, 38]; // Total: 190mm

  // Draw header background
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, tableWidth, headerHeight, 'F');

  // Draw header borders and text
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let currentX = margin;
  headers.forEach((header, index) => {
    // Draw cell border
    doc.rect(currentX, yPosition, colWidths[index], headerHeight);

    // Add header text (centered)
    doc.text(header, currentX + colWidths[index] / 2, yPosition + 10, { align: 'center' });
    currentX += colWidths[index];
  });

  yPosition += headerHeight;

  // Draw table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (let i = 0; i < quotation.items.length; i++) {
    const item = quotation.items[i];

    // Check if we need a new page
    if (yPosition + rowHeight > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;

      // Redraw headers on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, tableWidth, headerHeight, 'F');

      currentX = margin;
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        doc.rect(currentX, yPosition, colWidths[index], headerHeight);
        doc.text(header, currentX + colWidths[index] / 2, yPosition + 10, { align: 'center' });
        currentX += colWidths[index];
      });
      yPosition += headerHeight;
      doc.setFont('helvetica', 'normal');
    }

    // Calculate values
    const rate = parseFloat(item.rate) || 0;
    const quantity = parseInt(item.quantity) || 1;
    const discount = parseFloat(item.discount) || 0;

    // Format discount display based on type
    let discountDisplay = '';
    if (discount > 0) {
      if (item.discount_type === 'PERCENTAGE') {
        discountDisplay = `${discount}%`;
      } else if (item.discount_type === 'PER_PIECE') {
        discountDisplay = `${discount}/piece`;
      } else {
        discountDisplay = discount.toString();
      }
    }

    // Merge product name and description
    const productName = item.product?.name || 'N/A';
    const description = item.description && item.description.trim() !== '' ? item.description : '';
    const productWithDescription = description ? `${productName} - ${description}` : productName;

    // Row data
    const rowData = [
      (i + 1).toString(),
      productWithDescription,
      item.location?.name || 'N/A',
      rate.toFixed(2),
      item.unit || 'PCS',
      quantity.toString(),
      discountDisplay,
      '', // Image column - will be handled separately
    ];

    // Draw row cells and add text
    currentX = margin;
    rowData.forEach((cellData, colIndex) => {
      // Draw cell border
      doc.rect(currentX, yPosition, colWidths[colIndex], rowHeight);

      if (colIndex < rowData.length - 1) {
        // Skip image column for text
        // Always use text wrapping to prevent overflow
        const maxWidth = colWidths[colIndex] - 4; // Leave padding
        const lines = doc.splitTextToSize(cellData, maxWidth);
        const lineHeight = 3.5;
        let textY = yPosition + 5;
        const maxLines = Math.floor((rowHeight - 6) / lineHeight);

        // Determine alignment based on column type
        const align = getColumnAlignment(colIndex);

        lines.slice(0, maxLines).forEach((line, lineIndex) => {
          let textX;

          if (align === 'center') {
            textX = currentX + colWidths[colIndex] / 2;
          } else if (align === 'right') {
            textX = currentX + colWidths[colIndex] - 2;
          } else {
            textX = currentX + 2;
          }

          doc.text(line, textX, textY, { align: align });
          textY += lineHeight;
        });

        // If text was truncated, add ellipsis
        if (lines.length > maxLines) {
          const lastLineY = yPosition + 5 + (maxLines - 1) * lineHeight;
          const ellipsisX =
            align === 'right'
              ? currentX + colWidths[colIndex] - 8
              : currentX + colWidths[colIndex] - 6;
          doc.text('...', ellipsisX, lastLineY);
        }
      }

      currentX += colWidths[colIndex];
    });

    // Add image in the last column if available
    if (item.images && item.images.length > 0) {
      try {
        const imagePath = item.images[0]; // Use first image
        const { base64: base64Image } = await downloadImageAsBase64(imagePath);

        // Calculate image dimensions to fit in cell (maintain aspect ratio)
        const maxImageWidth = colWidths[7] - 4;
        const maxImageHeight = rowHeight - 4;
        const imageX = currentX - colWidths[7] + 2;
        const imageY = yPosition + 2;

        // Maintain aspect ratio while fitting in cell
        let imageWidth = maxImageWidth;
        let imageHeight = maxImageHeight;

        // Center the image in the cell
        const centerX = imageX + (maxImageWidth - imageWidth) / 2;
        const centerY = imageY + (maxImageHeight - imageHeight) / 2;

        doc.addImage(base64Image, 'JPEG', centerX, centerY, imageWidth, imageHeight);
      } catch (error) {
        console.error('Error adding image to table:', error);
        // Add placeholder text
        doc.setFontSize(6);
        doc.text('Image', currentX - colWidths[7] + colWidths[7] / 2, yPosition + 10, {
          align: 'center',
        });
        doc.setFontSize(8);
      }
    }

    yPosition += rowHeight;
  }

  return yPosition + 10;
};

/**
 * Add footer with remarks (if present) and terms and conditions
 */
const addPDFFooter = (doc, pageWidth, pageHeight, margin, quotation, startY) => {
  let footerY = startY + 10; // Start 10mm after the table

  // Check if we need a new page for the footer content
  const estimatedFooterHeight = 80; // Estimate space needed for footer content
  if (footerY + estimatedFooterHeight > pageHeight - margin) {
    doc.addPage();
    footerY = margin;
  }

  // Add remarks section if remarks exist (just above terms & conditions)
  if (quotation && quotation.remarks && quotation.remarks.trim() !== '') {
    // Calculate space needed for remarks
    const maxWidth = pageWidth - margin * 2;
    const remarksLines = doc.splitTextToSize(quotation.remarks, maxWidth);

    // Add Remarks section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Remarks:', margin, footerY);

    // Remarks content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    let currentY = footerY + 5;
    remarksLines.forEach(line => {
      doc.text(line, margin, currentY);
      currentY += 4;
    });

    // Update footerY for terms & conditions
    footerY = currentY + 5;
  }

  // Terms & Conditions section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', margin, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // Dynamic GST term based on quotation price_type
  const gstTerm =
    quotation.price_type === PRICE_TYPES.INCLUSIVE_TAX ? 'GST Inclusive' : 'GST Exclusive';

  const terms = [
    '1. The selected products may be available as per stock available at the time of order placed by the customer.',
    '2. This Quotation is Valid for 10 Days.',
    '3. 100% Advance payment at the time of order.',
    '4. No Warranty/Guarantee on decorative products.',
    '5. Guarantee/Warranty/Services available as per the Manufacturers Policy.',
    `6. ${gstTerm}`,
    '7. Site Delivery & Labour charges extra which applies GST.',
    '8. Order once placed will not be cancelled, replaced or exchanged.',
    '9. Gst as applicable will be charged at the time of final billing.',
    '10. Transportation at Buyers risk.',
    '11. Subject to Ahmedabad Jurisdiction.',
  ];

  // Use wider width for terms to fit more content on one line
  const termsMaxWidth = pageWidth - margin * 2 - 5; // Use almost full page width with small margins
  let termY = footerY + 5;

  terms.forEach(term => {
    const termLines = doc.splitTextToSize(term, termsMaxWidth);
    termLines.forEach(line => {
      doc.text(line, margin, termY);
      termY += 4;
    });
  });

  // Add company footer on the last page (centered)
  const currentYear = new Date().getFullYear();
  const companyFooterText = `Maruti Laminates | ${currentYear} | GST: ${COMPANY_INFO.GST_NUMBER}`;

  // Position at bottom center of the page
  doc.setFontSize(10); // Increased from 8 to 10
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100); // Gray color
  doc.text(companyFooterText, pageWidth / 2, pageHeight - 5, { align: 'center' });
};

/**
 * Generate PDF and upload to S3
 * @param {Object} quotation - Quotation data
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<string>} - S3 path of uploaded PDF
 */
const generateAndUploadQuotationPDF = async (quotation, quotationId) => {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generateQuotationPDF(quotation, quotationId);

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(pdfBuffer);

    // Generate filename
    const timestamp = Date.now();
    const fileName = `quotation-${quotationId}-${timestamp}.pdf`;
    const s3Path = `quotations/${quotationId}/${fileName}`;

    // Upload to S3
    const uploadedPath = await uploadFile(buffer, fileName, 'application/pdf', quotationId);

    return uploadedPath;
  } catch (error) {
    console.error('PDF generation and upload error:', error);
    throw new Error(`Failed to generate and upload PDF: ${error.message}`);
  }
};

/**
 * Delete PDF from S3
 * @param {string} pdfPath - S3 path of the PDF
 * @returns {Promise<void>}
 */
const deleteQuotationPDF = async pdfPath => {
  try {
    await deleteImage(pdfPath);
  } catch (error) {
    console.error('PDF deletion error:', error);
    // Don't throw error as PDF deletion is not critical
  }
};

/**
 * Get PDF URL from S3 path
 * @param {string} pdfPath - S3 path of the PDF
 * @returns {string} - Full URL of the PDF
 */
const getQuotationPDFUrl = pdfPath => {
  return getImageUrl(pdfPath);
};

module.exports = {
  generateQuotationPDF,
  generateAndUploadQuotationPDF,
  deleteQuotationPDF,
  getQuotationPDFUrl,
};
