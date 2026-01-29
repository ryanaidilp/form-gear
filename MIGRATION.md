# Migration Guide: FormGear 1.x to 2.0

This guide helps you migrate from FormGear 1.x to the new 2.0 API.

## Overview of Changes

FormGear 2.0 introduces a modern, type-safe API while maintaining functionality:

| Feature | v1.x | v2.0 |
|---------|------|------|
| API Style | 16 positional parameters | Options object pattern |
| TypeScript | Partial types | Full strict TypeScript |
| Instance Control | Callbacks only | Programmatic methods |
| Platform Bridge | Hardcoded checks | Modular bridge abstraction |

## Quick Migration

### Before (v1.x)

```typescript
import { FormGear } from 'form-gear';

FormGear(
  referenceJson,
  templateJson,
  presetJson,
  responseJson,
  validationJson,
  mediaJson,
  remarkJson,
  {
    clientMode: 1,
    formMode: 1,
    initialMode: 2,
    lookupMode: 1,
    username: 'user123',
    token: 'abc123',
    baseUrl: 'https://api.example.com',
  },
  uploadHandler,
  gpsHandler,
  offlineSearch,
  onlineSearch,
  exitHandler,
  saveCallback,
  submitCallback,
  openMapHandler
);
```

### After (v2.0)

```typescript
import { createFormGear, ClientMode, FormMode, InitialMode, LookupMode } from 'form-gear';

const form = createFormGear({
  data: {
    reference: referenceJson,
    template: templateJson,
    preset: presetJson,
    response: responseJson,
    validation: validationJson,
    media: mediaJson,
    remark: remarkJson,
  },
  config: {
    clientMode: ClientMode.CAWI,
    formMode: FormMode.OPEN,
    initialMode: InitialMode.ASSIGN,
    lookupMode: LookupMode.ONLINE,
    username: 'user123',
    token: 'abc123',
    baseUrl: 'https://api.example.com',
  },
  mobileHandlers: {
    uploadHandler,
    gpsHandler,
    offlineSearch,
    onlineSearch,
    exitHandler,
    openMap: openMapHandler,
  },
  callbacks: {
    onSave: saveCallback,
    onSubmit: submitCallback,
  },
});
```

## Enums Reference

### ClientMode

| v1.x Value | v2.0 Enum |
|------------|-----------|
| `1` | `ClientMode.CAWI` |
| `2` | `ClientMode.CAPI` |

### FormMode

| v1.x Value | v2.0 Enum |
|------------|-----------|
| `1` | `FormMode.OPEN` |
| `2` | `FormMode.REVIEW` |
| `3` | `FormMode.CLOSE` |

### InitialMode

| v1.x Value | v2.0 Enum |
|------------|-----------|
| `1` | `InitialMode.INITIAL` |
| `2` | `InitialMode.ASSIGN` |

### LookupMode

| v1.x Value | v2.0 Enum |
|------------|-----------|
| `1` | `LookupMode.ONLINE` |
| `2` | `LookupMode.OFFLINE` |

## New Instance Methods

v2.0 returns a form instance with programmatic methods:

```typescript
const form = createFormGear({ ... });

// Get current form data
const responses = form.getResponse();
const media = form.getMedia();
const remarks = form.getRemarks();
const principal = form.getPrincipal();
const summary = form.getSummary();

// Validate form
const isValid = form.validate();

// Get/Set values
const value = form.getValue('dataKey');
form.setValue('dataKey', newValue);

// Trigger save/submit programmatically
form.save();
form.submit();

// Cleanup when done
form.destroy();
```

## Platform Bridge

v2.0 includes a modular native bridge for platform detection and communication:

```typescript
import {
  createBridge,
  detectPlatform,
  isNativeApp,
  isMobile,
  getPlatformName,
} from 'form-gear';

// Auto-detect and create appropriate bridge
const bridge = createBridge();

// Check platform
console.log(getPlatformName()); // 'android' | 'ios' | 'flutter' | 'web'
console.log(isNativeApp()); // true if running in native app
console.log(isMobile()); // true if mobile device

// Use bridge for native communication
bridge.getGpsPhoto('location', (result) => {
  console.log(result.latitude, result.longitude);
});
```

### Platform-Specific Bridges

```typescript
import {
  createAndroidBridge,
  createIOSBridge,
  createFlutterInAppWebViewBridge,
  createWebBridge,
} from 'form-gear';

// Create specific bridge when you know the platform
const bridge = createAndroidBridge();
```

## TypeScript Types

All types are now exported for full TypeScript support:

```typescript
import type {
  // Configuration
  FormGearConfig,
  FormGearOptions,
  FormGearInstance,
  FormGearData,
  FormGearCallbacks,

  // Handlers
  UploadHandler,
  GpsHandler,
  OfflineSearchHandler,
  OnlineSearchHandler,

  // Components
  FormComponentProps,
  Option,
  RangeInput,
  LengthInput,

  // Store types
  ResponseState,
  ReferenceState,
  ValidationState,

  // Bridge types
  NativeBridge,
  Platform,
  GpsPhotoResult,
} from 'form-gear';
```

## CSS Import

Import the styles in your application:

```typescript
// ES Modules
import 'form-gear/style.css';

// Or use the dist path
import 'form-gear/dist/style.css';
```

## Breaking Changes Summary

1. **`FormGear` export removed** - Use `createFormGear()` instead
2. **Numeric config values** - Use enums (`ClientMode.CAWI` instead of `1`)
3. **Parameter ordering** - Use named options object instead of 16 positional params
4. **Handler naming** - `exitHandler` instead of `mobileExit`, `openMap` instead of `openMapHandler`

## Example: Complete Setup

```typescript
import { createFormGear, ClientMode, FormMode, LookupMode } from 'form-gear';
import 'form-gear/style.css';

// Load your JSON data
const template = await fetch('/data/template.json').then(r => r.json());
const validation = await fetch('/data/validation.json').then(r => r.json());
const preset = await fetch('/data/preset.json').then(r => r.json());

// Create form instance
const form = createFormGear({
  data: {
    template,
    validation,
    preset,
    response: {}, // Empty for new form
    reference: {}, // Will be generated
    media: {},
    remark: {},
  },
  config: {
    clientMode: ClientMode.CAWI,
    formMode: FormMode.OPEN,
    lookupMode: LookupMode.ONLINE,
    username: 'surveyor01',
    baseUrl: 'https://api.example.com',
    token: localStorage.getItem('authToken') || '',
  },
  mobileHandlers: {
    uploadHandler: (type, dataKey, callback) => {
      // Handle file uploads
    },
    gpsHandler: (dataKey, callback) => {
      // Handle GPS requests
    },
    onlineSearch: async (id, version, params) => {
      // Fetch lookup data from API
      return await fetch(`/lookup/${id}`).then(r => r.json());
    },
  },
  callbacks: {
    onSave: (response, media, remark, principal, reference) => {
      console.log('Form saved:', response);
      // Save to local storage or send to server
    },
    onSubmit: (response, media, remark, principal, reference) => {
      console.log('Form submitted:', response);
      // Submit to server
    },
  },
});

// Use instance methods
document.getElementById('validateBtn')?.addEventListener('click', () => {
  if (form.validate()) {
    console.log('Form is valid!');
  } else {
    console.log('Form has errors');
  }
});

document.getElementById('submitBtn')?.addEventListener('click', () => {
  form.submit();
});
```

## FormGear Builder

FormGear now has a visual **Template Builder** - a drag-and-drop interface for creating form templates without writing JSON manually.

**The builder is available in a separate repository:** [formgear-builder](https://github.com/AdityyaX/formgear-builder)

### Builder Overview

The builder is a Vue 3 application that generates `template.json` and `validation.json` files compatible with all FormGear versions.

| Output File | Description |
|-------------|-------------|
| `template.json` | Form structure, components, metadata |
| `validation.json` | Validation rules and test functions |

### Builder Features

- **Drag-and-drop** component palette with all 38 component types
- **Visual form canvas** with nested component support (Section, Nested)
- **Properties panel** for editing component attributes
- **Expression builder** for `enableCondition` and validation `test` expressions
- **Live preview** using the actual FormGear engine
- **Import/Export** existing JSON templates

### Form Metadata

The builder supports all form metadata fields:

| Field | Description |
|-------|-------------|
| `title` | Form title displayed at the top |
| `description` | Form description/subtitle |
| `dataKey` | Unique form identifier |
| `acronym` | Short form acronym |
| `version` | Semantic version (e.g., "1.0.0") |

### Export Structure

The builder exports files in the same format as the FormGear engine expects:

**template.json:**
```json
{
  "description": "My Survey",
  "dataKey": "my_survey",
  "title": "Survey Title",
  "acronym": "MS",
  "version": "1.0.0",
  "components": [
    [
      {
        "label": "Section 1",
        "dataKey": "section_1",
        "type": 1,
        "components": [
          [
            { "label": "Name", "dataKey": "name", "type": 25 }
          ]
        ]
      }
    ]
  ]
}
```

**validation.json:**
```json
{
  "dataKey": "my_survey",
  "version": "1.0.0",
  "testFunctions": [
    {
      "dataKey": "name",
      "componentValidation": ["name"],
      "validations": [
        {
          "test": "getValue('name') == ''",
          "message": "Name is required",
          "type": 1
        }
      ]
    }
  ]
}
```

### Backward Compatibility

The builder's JSON output is **fully backward compatible** with:
- FormGear 1.x ✅
- FormGear 2.x ✅

The builder uses Vue 3 and Tailwind CSS v4 internally, but this doesn't affect compatibility since it only outputs standard JSON files.

### Note on reference.json

`reference.json` is **NOT** generated by the builder. It's a runtime state file created by the FormGear engine when initializing a form. The builder only exports `template.json` and `validation.json`.

## Need Help?

- Check the [CHANGELOG.md](./CHANGELOG.md) for all changes
- Open an issue on [GitHub](https://github.com/AdityaSetyadi/form-gear/issues)
