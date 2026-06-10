# Annexure System Documentation

## Overview
The Annexure system provides reusable templates for creating standardized inspection and test report documents. Each annexure follows a specific format with:
- **Black text** for static headings and labels
- **Red text** for dynamic data that will be populated from API/database
- Responsive layouts that adapt to data volume
- Print-ready formatting

## File Structure

```
src/
├── components/
│   ├── AnnexureTemplate.jsx          # Reusable base template
│   ├── AnnexureTemplate.css          # Base styling
│   └── annexures/
│       ├── ChemicalAnalysisAnnexure.jsx          # Simple version
│       ├── ChemicalAnalysisAnnexureAdvanced.jsx  # Complex table version
│       ├── ChemicalAnalysisAnnexure.css          # Specific styles
│       └── README.md                              # This file
└── pages/
    ├── AnnexurePage.jsx              # Main annexure listing page
    └── AnnexurePage.css              # Page styling
```

## Creating a New Annexure

### Step 1: Create the Annexure Component

Create a new file in `src/components/annexures/YourAnnexure.jsx`:

```jsx
import React from 'react';
import AnnexureTemplate from '../AnnexureTemplate';

const YourAnnexure = ({ data = [] }) => {
  const headerData = {
    logoText: 'RITES',
    companyName: 'RITES LTD',
    division: '(QA DIVISION)',
    mainTitle: 'INSPECTION & TEST PLAN',
    productName: 'YOUR PRODUCT NAME',
    docNo: 'QA/WR/MECH',
    issueNo: '',
    pageNo: '1 of 1',
    effectiveDate: '',
    preparedBy: 'KEM',
    checkedBy: 'CSR',
    approvedBy: 'GM(I)/WR'
  };

  const tableHeaders = [
    { label: 'Column 1', rowSpan: 1, style: { width: '100px' } },
    { label: 'Column 2', rotated: true, rowSpan: 1 },
    // Add more headers...
  ];

  const tableData = data.map((row, index) => ({
    cells: [
      { value: row.field1, isData: false },  // Black text
      { value: row.field2, isData: true },   // Red text (dynamic data)
      // Add more cells...
    ]
  }));

  const footerData = {
    stampText: 'STAMP',
    ieName: 'Inspector Name',
    ieDesignation: 'Designation',
    ieLocation: 'Location'
  };

  return (
    <AnnexureTemplate
      headerData={headerData}
      title="Your Annexure Title"
      subtitle="Your Subtitle"
      annexureNumber="Annexure-X"
      annexureCode="CODE-2025"
      tableHeaders={tableHeaders}
      tableData={tableData}
      footerData={footerData}
    />
  );
};

export default YourAnnexure;
```

### Step 2: Register in AnnexurePage

Add your annexure to the list in `src/pages/AnnexurePage.jsx`:

```jsx
import YourAnnexure from '../components/annexures/YourAnnexure';

const annexureList = [
  // ... existing annexures
  {
    id: 'your-annexure',
    title: 'Your Annexure Title',
    subtitle: 'Description of your annexure',
    code: 'Annexure-X',
    icon: '📊',
    component: YourAnnexure
  }
];
```

## Complex Table Structures

For complex tables with multi-row headers (like Chemical Analysis), create a custom component:

```jsx
<table className="annexure-table">
  <thead>
    <tr>
      <th rowSpan="3">Column 1</th>
      <th colSpan="2">Grouped Header</th>
    </tr>
    <tr>
      <th>Sub Header 1</th>
      <th>Sub Header 2</th>
    </tr>
  </thead>
  <tbody>
    {/* Your data rows */}
  </tbody>
</table>
```

## Styling Guidelines

### Data vs Labels
- Use `className="annexure-td"` for static labels (black text)
- Use `className="annexure-td data-cell"` for dynamic data (red text)

### Rotated Headers
```jsx
<th className="annexure-th rotated-header">
  <div className="rotated-text">Your Text</div>
</th>
```

### Responsive Design
The template automatically handles:
- Mobile-friendly layouts
- Scrollable tables on small screens
- Print-optimized formatting

## API Integration

To populate data from API:

```jsx
const [annexureData, setAnnexureData] = useState({});

useEffect(() => {
  fetch('/api/annexure/chemical-analysis')
    .then(res => res.json())
    .then(data => setAnnexureData(prev => ({
      ...prev,
      'chemical-analysis': data
    })));
}, []);
```

## Print Functionality

The system includes built-in print support:
- Use the Print button in the header bar
- Styles automatically optimize for printing
- Headers and footers are preserved

## Best Practices

1. **Reusability**: Use `AnnexureTemplate` for standard layouts
2. **Custom Components**: Create custom components for complex structures
3. **Data Validation**: Validate data before rendering
4. **Responsive**: Test on mobile devices
5. **Print Testing**: Always test print output
6. **Accessibility**: Use semantic HTML and proper labels

## Example Data Structure

```json
{
  "chemical-analysis": [
    {
      "sNo": 1,
      "date": "2025-01-15",
      "source": "Supplier A",
      "certNo": "CERT-001",
      "heatNo": "HEAT-123",
      "c": "0.55",
      "mn": "0.90",
      "si": "1.75"
    }
  ]
}
```

