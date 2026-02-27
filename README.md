# Invoice Generator

A Next.js application for creating, editing, and managing invoices with a visual A4-sized canvas builder.

## Features

- **Invoice Management**: Create, read, edit, and delete invoices
- **Visual Builder**: A4-sized canvas for designing invoice layouts
- **Cell-based Editor**: Add and customize cells with text or images
- **Context Menu**: Right-click on cells to add cells in specific directions or delete
- **Cell Properties**: Edit cell properties including:
  - Position and size (X, Y, Width, Height)
  - Font properties (size, family, weight, color)
  - Text alignment
  - Cell type (text or image)
  - Field names and image sources
- **Templates**: Save invoice configurations as templates and reuse them
- **MongoDB Integration**: All data persisted in MongoDB
- **Auto-generated Invoice Numbers**: Starting from 10000

## Getting Started

### Prerequisites

- Node.js 18+ (LTS)
- MongoDB instance running locally or connection string

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/invoice-generator
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
invoice-generator/
├── app/
│   ├── api/
│   │   ├── invoices/
│   │   │   ├── route.ts          # GET all invoices, POST new invoice
│   │   │   └── [id]/route.ts     # GET, PUT, DELETE specific invoice
│   │   └── templates/
│   │       ├── route.ts          # GET all templates, POST new template
│   │       └── [id]/route.ts     # GET, PUT, DELETE specific template
│   ├── create/
│   │   └── page.tsx              # Create invoice page
│   ├── edit/
│   │   └── [id]/page.tsx         # Edit invoice page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Invoice list page
│   └── globals.css               # Global styles
├── components/
│   ├── InvoiceBuilder.tsx        # Main invoice builder component
│   ├── InvoiceList.tsx           # Invoice list page component
│   ├── CellContextMenu.tsx       # Right-click context menu
│   ├── CellPropertiesPanel.tsx   # Cell properties side panel
│   └── TemplateSelector.tsx      # Template selection modal
├── lib/
│   ├── db.ts                     # MongoDB connection
│   └── models/
│       ├── Invoice.ts            # Invoice schema
│       └── InvoiceTemplate.ts    # Template schema
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Usage

### Creating an Invoice

1. Go to the Invoices page (home)
2. Click "New Invoice"
3. Optionally select from saved templates
4. Add cells to the A4 canvas
5. Customize each cell with properties
6. Optionally save as a template
7. Click "Save Invoice"

### Building the Invoice Layout

1. Click the "+ Add Cell" button to start with the first cell
2. Click subsequent "+ Add Cell" button to add more cells
3. Right-click any cell to:
   - Add cells in specific directions (top, bottom, left, right)
   - Delete the cell
4. Click on a cell and toggle "Show Properties" to edit:
   - Position (X, Y coordinates)
   - Size (Width, Height)
   - Field name (unique identifier)
   - Text properties (font, size, color, alignment)
   - Image properties (upload or URL)

### Managing Templates

- When creating/editing an invoice, check "Save as Template"
- Enter a template name to save the current layout
- When creating a new invoice, you can select existing templates
- Edit or delete templates via the API or create new ones

## Database Schema

### Invoice

```typescript
{
  invoiceNumber: number,      // Auto-incremented from 10000
  templateId?: ObjectId,       // Reference to template
  cells: [
    {
      id: string,
      type: "text" | "image",
      x: number,              // X position in mm
      y: number,              // Y position in mm
      width: number,          // Width in mm
      height: number,         // Height in mm
      fontSize?: number,
      color?: string,
      fieldName?: string,     // Unique field identifier
      imageSrc?: string,
      content?: string,
      fontFamily?: string,
      fontWeight?: string,
      textAlign?: string
    }
  ],
  templateName?: string,
  saveAsTemplate: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### InvoiceTemplate

```typescript
{
  name: string,
  description?: string,
  cells: [Cell],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Invoices

- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get specific invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Templates

- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/:id` - Get specific template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

## Technologies Used

- **Next.js 15.2** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Axios** - HTTP client

## Development Notes

- A4 page dimensions: 210mm × 297mm
- All cell measurements are in millimeters
- Cells can overlap or be positioned outside the A4 boundary (at user's discretion)
- Field names must be unique within each invoice
- Invoice numbers are automatically generated and incremented

## Future Enhancements

- PDF export functionality
- Print preview
- Undo/Redo functionality
- Cell groups and layers
- More image options and optimization
- User authentication
- Invoice versioning
- Email integration

## License

MIT
