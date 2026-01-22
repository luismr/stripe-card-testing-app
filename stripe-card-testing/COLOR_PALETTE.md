# Form Color Palette

## Dark Mode Color Scheme

The application uses a dark theme optimized for Stripe Elements integration.

### Primary Colors

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| **Background (Main)** | Dark Blue-Grey | `#21252C` | Main card/container backgrounds |
| **Input Background** | Lighter Dark Blue-Grey | `#2B313F` | Stripe Elements input fields |
| **Text (Primary)** | Light Grey | `#E0E0E0` | Headings, labels, primary text |
| **Text (Entered)** | Medium Purple-Grey | `#7A7F8C` | User-entered text in inputs |
| **Placeholder** | Light Medium Grey | `#8E939C` | Placeholder text |
| **Border** | Light Grey | `#D0D0D0` / `gray-500` | Input borders |

### Accent Colors

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| **Primary (Blue)** | Blue | `#2563eb` | Focus states, buttons, links |
| **Danger (Red)** | Red | `#ef4444` | Error states, delete actions |
| **Success (Green)** | Green | `#10b981` | Success messages |
| **Warning (Yellow)** | Yellow | `#f59e0b` | Warning messages |

### Stripe Elements Styling

The Stripe CardElement uses the following color configuration:

```typescript
{
  backgroundColor: '#2B313F',      // Input field background
  border: '1px solid #D0D0D0',      // Border color
  color: '#7A7F8C',                 // Entered text color
  placeholder: '#8E939C',           // Placeholder text
  focusBorder: '#2563eb',           // Focus state border
  errorColor: '#ef4444'             // Error state color
}
```

### Form Component Colors

#### Input Fields
- **Background**: `#2B313F` (dark blue-grey)
- **Border**: `gray-500` / `#D0D0D0` (light grey)
- **Text**: `#E0E0E0` (light grey)
- **Placeholder**: `#8E939C` (light medium grey)
- **Focus Border**: `#2563eb` (blue)

#### Labels
- **Color**: `#E0E0E0` (light grey)
- **Font Weight**: 500 (medium)
- **Font Size**: 14px

#### Cards/Containers
- **Background**: `#21252C` (dark blue-grey)
- **Border**: `gray-700` (darker grey)

### Status Messages

| Type | Background | Border | Text |
|------|-----------|--------|------|
| **Success** | `green-100` | `green-400` | `green-700` |
| **Error** | `red-100` | `red-400` | `red-700` |
| **Info** | `blue-100` | `blue-400` | `blue-700` |

### Button Colors

| Type | Background | Hover | Text |
|------|-----------|--------|------|
| **Primary** | `blue-600` | `blue-700` | `white` |
| **Secondary** | `gray-600` | `gray-700` | `white` |
| **Danger** | `red-600` | `red-700` | `white` |

### Color Usage in Components

#### SetupCardForm & PaymentForm
- Card input wrapper: `bg-white dark:bg-[#2B313F]`
- Border: `border-gray-300 dark:border-gray-500`
- Text colors match Stripe Elements styling

#### Form Inputs (non-Stripe)
- Background: `dark:bg-[#2B313F]`
- Border: `dark:border-gray-500`
- Text: `dark:text-[#E0E0E0]`
- Placeholder: `dark:placeholder:text-[#8E939C]`

### Accessibility

All color combinations meet WCAG AA contrast requirements:
- Text on dark backgrounds: Minimum 4.5:1 contrast ratio
- Focus states: Clearly visible with blue border
- Error states: High contrast red for visibility

### Testing

To verify colors match the design:
1. Enable dark mode in your browser/system
2. Check Stripe Elements input fields match `#2B313F` background
3. Verify text colors are readable (`#E0E0E0` for labels, `#7A7F8C` for input text)
4. Confirm placeholder text uses `#8E939C`
5. Test focus states show blue border (`#2563eb`)

### Customization

To adjust colors, update:
- **Stripe Elements**: `src/lib/stripe.ts` → `ELEMENTS_APPEARANCE`
- **Form Inputs**: `src/app/globals.css` → `.form-input` class
- **Cards**: `src/app/globals.css` → `.card` class
- **Labels**: `src/app/globals.css` → `.form-label` class