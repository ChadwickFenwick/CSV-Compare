const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const CSVProcessor = require('./lib/csvProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

app.post('/api/upload', upload.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.files || !req.files.file1 || !req.files.file2) {
      return res.status(400).json({ error: 'Both CSV files are required' });
    }

    const file1Data = req.files.file1[0].buffer.toString('utf8');
    const file2Data = req.files.file2[0].buffer.toString('utf8');

    res.json({
      success: true,
      files: {
        file1: {
          name: req.files.file1[0].originalname,
          size: req.files.file1[0].size,
          data: file1Data
        },
        file2: {
          name: req.files.file2[0].originalname,
          size: req.files.file2[0].size,
          data: file2Data
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process uploaded files' });
  }
});

app.post('/api/preview', async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'CSV data is required' });
    }

    const preview = await CSVProcessor.getColumnPreview(csvData);
    res.json(preview);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Failed to generate CSV preview' });
  }
});

app.post('/api/compare', async (req, res) => {
  try {
    const { file1Data, file2Data, comparisonRules } = req.body;

    if (!file1Data || !file2Data || !comparisonRules) {
      return res.status(400).json({ error: 'Missing required data for comparison' });
    }

    if (!Array.isArray(comparisonRules) || comparisonRules.length === 0) {
      return res.status(400).json({ error: 'At least one comparison rule is required' });
    }

    const results = await CSVProcessor.compareCSVs(file1Data, file2Data, comparisonRules);
    res.json(results);
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Failed to compare CSV files' });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { data, headers, filename } = req.body;

    if (!data || !headers) {
      return res.status(400).json({ error: 'Data and headers are required for export' });
    }

    const csvContent = CSVProcessor.exportToCSV(data, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export.csv'}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CSV Compare Tool running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});