# FormGear 2.0 SolidJS Example

This is a working example of FormGear 2.0 with SolidJS.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
example/
├── src/
│   ├── data/           # Form configuration JSON files
│   │   ├── template.json    # Form structure and components
│   │   ├── validation.json  # Validation rules
│   │   ├── preset.json      # Default values
│   │   ├── response.json    # Saved responses
│   │   ├── reference.json   # Reference data
│   │   ├── media.json       # Media attachments
│   │   └── remark.json      # Comments/notes
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Entry point
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── vite.config.ts      # Vite config
```

## FormGear 2.0 API

```typescript
import {
  createFormGear,
  ClientMode,
  FormMode,
  InitialMode,
  LookupMode,
} from 'form-gear';

const form = createFormGear({
  data: {
    template,      // Form structure
    validation,    // Validation rules
    preset,        // Default values
    response,      // Existing responses
    reference,     // Reference data
    media,         // Media files
    remark,        // Notes/comments
  },
  config: {
    clientMode: ClientMode.CAWI,    // CAWI or CAPI
    formMode: FormMode.OPEN,        // OPEN, REVIEW, or CLOSE
    initialMode: InitialMode.ASSIGN,
    lookupMode: LookupMode.ONLINE,
    username: 'user',
  },
  mobileHandlers: {
    uploadHandler,
    gpsHandler,
    offlineSearch,
    onlineSearch,
    exitHandler,
    openMap,
  },
  callbacks: {
    onSave,
    onSubmit,
  },
});
```

## Client Modes

- **CAWI** (Computer-Assisted Web Interviewing) - Web browser mode
- **CAPI** (Computer-Assisted Personal Interviewing) - Mobile app mode with native bridge

## Learn More

- [FormGear Documentation](../README.md)
- [Migration Guide](../MIGRATION.md)
- [Changelog](../CHANGELOG.md)
