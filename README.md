# CSV Compare Tool

A powerful web application for comparing two CSV files with multi-level matching rules and comprehensive reporting. Built specifically for easy deployment on Railway.com.

## Features

- **Dual CSV Upload**: Simple drag-and-drop interface for uploading two CSV files
- **Smart Column Detection**: Automatic parsing and preview of CSV headers and sample data
- **Multi-Level Comparison Rules**: Set up primary and fallback matching rules (e.g., User ID → Email → Phone)
- **Comprehensive Reporting**: Detailed statistics and results dashboard
- **Export Functionality**: Download missing records and matched data as CSV files
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Backend**: Node.js with Express.js
- **CSV Processing**: Papa Parse library
- **File Upload**: Multer middleware
- **Frontend**: Vanilla JavaScript with modern CSS
- **Deployment**: Railway.com optimized

## Quick Start

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd CSV_Compare_Tool
   npm install
   ```

2. **Run Locally**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

3. **Access the Application**
   Open http://localhost:3000 in your browser

### Deploy to Railway.com

1. **Connect Repository**
   - Push your code to GitHub
   - Connect your GitHub repository to Railway
   - Railway will auto-detect the Node.js project

2. **Automatic Deployment**
   - Railway will automatically install dependencies
   - The app will be available at your Railway-provided URL
   - No additional configuration needed!

## How to Use

### Step 1: Upload CSV Files
- Drag and drop or click to upload two CSV files
- Files are validated to ensure they're proper CSV format
- File information (name, size) is displayed

### Step 2: Configure Comparison Rules
- **Primary Rule**: Set the main columns to compare between both files
- **Fallback Rules**: Add additional comparison rules as backups
- Each rule compares a column from File 1 with a column from File 2
- Rules are processed in priority order

### Step 3: View Results
- **Statistics Dashboard**: Overview of total records, matches, and missing data
- **Missing Records**: Records from File 1 that have no match in File 2
- **Matched Records**: Successfully matched records with rule details
- **Export Options**: Download results as CSV files

## Example Use Cases

### Customer Data Reconciliation
- **File 1**: Current customer database
- **File 2**: New customer imports
- **Rules**:
  1. Customer ID match
  2. Email address match
  3. Phone number match

### Product Inventory Sync
- **File 1**: Current inventory
- **File 2**: Supplier catalog
- **Rules**:
  1. SKU match
  2. Product name match
  3. Barcode match

### User Account Merging
- **File 1**: Legacy user accounts
- **File 2**: New system users
- **Rules**:
  1. User ID match
  2. Username match
  3. Email match

## API Endpoints

- `POST /api/upload` - Upload and process CSV files
- `POST /api/preview` - Generate CSV preview with headers
- `POST /api/compare` - Run comparison with specified rules
- `POST /api/export` - Export results as CSV
- `GET /health` - Health check endpoint

## File Structure

```
CSV_Compare_Tool/
├── lib/
│   └── csvProcessor.js    # Core CSV processing logic
├── public/
│   ├── index.html         # Main web interface
│   ├── style.css          # Responsive styling
│   └── app.js            # Frontend JavaScript
├── server.js             # Express server
├── package.json          # Dependencies and scripts
├── railway.toml          # Railway deployment config
└── README.md            # This file
```

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

### File Upload Limits
- Maximum file size: 10MB per file
- Supported formats: CSV files only
- Memory storage for processing

## Error Handling

The application includes comprehensive error handling for:
- Invalid file formats
- Malformed CSV data
- Network connectivity issues
- Server processing errors
- Large file handling

## Security Features

- Helmet.js for security headers
- File type validation
- File size limits
- CORS configuration
- Input sanitization

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for commercial or personal purposes.

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify CSV file formats are valid
3. Ensure stable internet connection
4. Contact support with specific error details