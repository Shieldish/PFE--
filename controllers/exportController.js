const Soutenance = require('../model/soutenanceModel');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.exportData = async (req, res) => {
  try {
    const { exportFormat, reorganizeId } = req.body;

    // Fetch data from your database using Sequelize
    let data = await Soutenance.findAll({
        raw: true,
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });
      

      if (reorganizeId) {
        data = data.map((item, index) => ({ ...item, id: index + 1 }));
      }

    let buffer;
    let contentType;
    let fileName;

    switch (exportFormat) {
      case 'csv':
        buffer = await generateCSV(data);
        contentType = 'text/csv';
        fileName ='soutenance_'+getFormattedDateTime()+'_.csv';
        break;
      case 'xlsx':
        buffer = await generateXLSX(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = 'soutenance_'+getFormattedDateTime()+'_.xlsx';
        break;
      case 'pdf':
        buffer = await generatePDF(data);
        contentType = 'application/pdf';
        fileName = 'soutenance_'+getFormattedDateTime()+'_.pdf';
        break;
      default:
        throw new Error('Invalid export format');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed '+error });
  }
};

async function generateCSV(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
  worksheet.addRows(data);
  return workbook.csv.writeBuffer();
}

async function generateXLSX(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
  worksheet.addRows(data);
  return workbook.xlsx.writeBuffer();
}

function  getFormattedDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
}

  
 
        async function generatePDF(data) {
            const doc = new PDFDocument({ layout: 'landscape' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {});
          
            const headers = Object.keys(data[0]);
            const tableData = data.map(item => headers.map(header => item[header]));
          
            const margin = 30;
            const cellPadding = 3;
            const cellWidth = (doc.page.width - 2 * margin) / headers.length;
            const cellHeight = 16;
            const headerHeight = 30; // Increased header height
            const fontSize = 8;
            const headerFontSize = 9;
            const rowsPerPage = Math.floor((doc.page.height - 2 * margin - headerHeight) / cellHeight);
          
            function drawTableHeader() {
              doc.font('Helvetica-Bold').fontSize(headerFontSize);
              headers.forEach((header, i) => {
                doc.text(header, i * cellWidth + margin + cellPadding, margin + cellPadding, {
                  width: cellWidth - 2 * cellPadding,
                  height: headerHeight - 2 * cellPadding,
                  align: 'left',
                  valign: 'center',
                  lineBreak: true
                });
              });
            }
          
            function drawTableContent(startRow, endRow) {
              doc.font('Helvetica').fontSize(fontSize);
              for (let rowIndex = startRow; rowIndex < endRow && rowIndex < tableData.length; rowIndex++) {
                const row = tableData[rowIndex];
                row.forEach((cell, cellIndex) => {
                  const cellValue = cell !== null && cell !== undefined ? cell.toString() : '';
                  doc.text(
                    cellValue,
                    cellIndex * cellWidth + margin + cellPadding,
                    (rowIndex - startRow) * cellHeight + margin + headerHeight + cellPadding,
                    {
                      width: cellWidth - 2 * cellPadding,
                      height: cellHeight - 2 * cellPadding,
                      align: 'left',
                      lineBreak: true
                    }
                  );
                });
              }
            }
          
            function drawTableLines(rowCount) {
              doc.lineWidth(0.5);
              // Horizontal lines
              doc.moveTo(margin, margin)
                 .lineTo(doc.page.width - margin, margin)
                 .stroke(); // Top of header
              doc.moveTo(margin, margin + headerHeight)
                 .lineTo(doc.page.width - margin, margin + headerHeight)
                 .stroke(); // Bottom of header
              for (let i = 1; i <= rowCount; i++) {
                doc.moveTo(margin, i * cellHeight + margin + headerHeight)
                   .lineTo(doc.page.width - margin, i * cellHeight + margin + headerHeight)
                   .stroke();
              }
              // Vertical lines
              for (let i = 0; i <= headers.length; i++) {
                doc.moveTo(i * cellWidth + margin, margin)
                   .lineTo(i * cellWidth + margin, rowCount * cellHeight + margin + headerHeight)
                   .stroke();
              }
            }
          
            let currentRow = 0;
            while (currentRow < tableData.length) {
              if (currentRow > 0) {
                doc.addPage();
              }
              drawTableHeader();
              const rowsToRender = Math.min(rowsPerPage, tableData.length - currentRow);
              drawTableContent(currentRow, currentRow + rowsToRender);
              drawTableLines(rowsToRender);
              currentRow += rowsToRender;
            }
          
            doc.end();
          
            return new Promise((resolve) => {
              doc.on('end', () => {
                resolve(Buffer.concat(buffers));
              });
            });
          } 


          