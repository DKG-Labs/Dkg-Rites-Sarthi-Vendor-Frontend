# DefectSelectionWithDynamicSpacing Component

## Overview

A React component that renders a list of defect types with checkboxes and labels, where the horizontal spacing between the checkbox and label dynamically changes based on whether the defect type matches the currently selected one.

## Features

- ✅ **Dynamic Spacing**: Gap adjusts automatically based on selection state
- ✅ **CSS Variables**: Easy to customize spacing values
- ✅ **Responsive Design**: Adapts to mobile and tablet screens
- ✅ **Smooth Transitions**: Animated spacing changes for better UX
- ✅ **Accessible**: Proper label-checkbox associations
- ✅ **Modular**: Clean, reusable component

## How the Spacing Logic Works

### Core Concept

The component tracks the **currently selected defect type** and applies different CSS gap values:

1. **When `isMatchingDefectType === true`** (defect matches selected):
   - Uses `--defect-gap-matching` (default: `8px`)
   - Creates a **tight, compact** visual appearance
   - Highlights the active/selected defect

2. **When `isMatchingDefectType === false`** (defect doesn't match):
   - Uses `--defect-gap-non-matching` (default: `24px`)
   - Creates a **spacious, separated** visual appearance
   - De-emphasizes non-selected defects

### Implementation Details

```javascript
// The component tracks the selected defect type
const [selectedDefectType, setSelectedDefectType] = useState(null);

// When a defect is toggled:
const isMatchingDefectType = selectedDefectType === defectType;

// CSS class is applied conditionally:
className={`defect-item ${isMatchingDefectType ? 'defect-item--matching' : 'defect-item--non-matching'}`}
```

### CSS Structure

```css
.defect-checkbox-wrapper {
  gap: var(--defect-gap-non-matching); /* Default: large gap */
  transition: gap 0.3s ease; /* Smooth animation */
}

.defect-item--matching .defect-checkbox-wrapper {
  gap: var(--defect-gap-matching); /* Override: small gap */
}
```

## Usage

### Basic Example

```jsx
import DefectSelectionWithDynamicSpacing from './DefectSelectionWithDynamicSpacing';

const MyComponent = () => {
  const [selectedDefects, setSelectedDefects] = useState({});
  
  const defectTypes = ['Distortion', 'Twist', 'Kink', 'Pitting'];
  
  const handleDefectChange = (defectType) => {
    setSelectedDefects(prev => ({
      ...prev,
      [defectType]: !prev[defectType]
    }));
  };

  return (
    <DefectSelectionWithDynamicSpacing
      defectTypes={defectTypes}
      selectedDefects={selectedDefects}
      onDefectChange={handleDefectChange}
    />
  );
};
```

### With Count Input

```jsx
const [defectCounts, setDefectCounts] = useState({});

const handleCountChange = (defectType, count) => {
  setDefectCounts(prev => ({
    ...prev,
    [defectType]: parseInt(count, 10) || 0
  }));
};

<DefectSelectionWithDynamicSpacing
  defectTypes={defectTypes}
  selectedDefects={selectedDefects}
  onDefectChange={handleDefectChange}
  onCountChange={handleCountChange}
  defectCounts={defectCounts}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `defectTypes` | `Array<string>` | Yes | `[]` | List of defect type names |
| `selectedDefects` | `Object` | Yes | `{}` | Object mapping defect types to boolean selection state |
| `onDefectChange` | `Function` | Yes | - | Callback `(defectType) => void` when checkbox is toggled |
| `onCountChange` | `Function` | No | - | Optional callback `(defectType, count) => void` for count input |
| `defectCounts` | `Object` | No | `{}` | Object mapping defect types to their counts |

## Customization via CSS Variables

All spacing values can be customized using CSS variables:

```css
:root {
  /* Spacing - Main customization points */
  --defect-gap-matching: 8px;        /* Small gap when matching */
  --defect-gap-non-matching: 24px;    /* Large gap when not matching */
  
  /* Layout */
  --defect-item-padding: 12px 16px;
  --defect-item-border-radius: 8px;
  
  /* Checkbox */
  --defect-checkbox-size: 20px;
  --defect-checkbox-accent: #16a34a;
  
  /* Label */
  --defect-label-font-size: 14px;
  --defect-label-font-weight: 500;
  --defect-label-color: #374151;
  
  /* Count Input */
  --defect-count-input-width: 120px;
  --defect-count-input-padding: 8px 12px;
}
```

### Example: Custom Spacing

```css
/* In your CSS file or component styles */
:root {
  --defect-gap-matching: 4px;      /* Very tight when selected */
  --defect-gap-non-matching: 32px; /* Very spacious when not selected */
}
```

## Responsive Behavior

The component automatically adjusts for different screen sizes:

- **Desktop (> 768px)**: Full layout with horizontal spacing
- **Tablet (≤ 768px)**: Reduced spacing, maintains horizontal layout
- **Mobile (≤ 480px)**: Further reduced spacing, optimized for touch

## Visual Flow

1. **Initial State**: All items have large gap (24px)
2. **User Selects Defect**: 
   - Selected item's gap reduces to 8px (compact)
   - Other items maintain 24px gap (spacious)
3. **User Deselects**: Gap returns to 24px
4. **User Selects Different Defect**: 
   - Previous selection returns to 24px
   - New selection reduces to 8px

## Accessibility

- ✅ Proper `label`-`input` associations via `htmlFor` and `id`
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus states for keyboard users

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- CSS Custom Properties (CSS Variables) support required

## Performance

- Uses React hooks efficiently
- CSS transitions for smooth animations (GPU-accelerated)
- Minimal re-renders (only affected items update)

## Example Integration

See `DefectSelectionExample.js` for a complete working example with state management.

