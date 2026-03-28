# Map/Address Enhancement TODO

## Approved Plan Steps (Breakdown)

### Step 1: Enhance MapPicker.tsx
- [x] Add forwardGeocode function (Nominatim search).
- [x] Add props: address, onAddressPreview, useDebounce.
- [x] Implement useEffect for address → geocode → update pos/preview.
- [ ] Add toggle visibility prop.
- [x] Expose current position preview.

**Current Progress: Step 1 Complete - Moving to Step 2**

### Step 2: Update src/App.tsx - Shared Utils
 - [x] Add useDebounce hook.
 - [x] Add forwardGeocode wrapper util.

### Step 3: Update Order Form (view='order')
 - [x] Add useMap state + toggle.
 - [x] Address onChange → debounce geocode → set map pos.
 - [x] MapPicker integration with bidirectional sync.
 - [x] Update validation (skip if !useMap).
 - [x] Submit: preserve full address, optional lat/lng.

**Current Progress: Order form complete. Next: Auth/Settings forms (Step 4-5)**

**Completed Steps: Step 1, Step 2, Step 3**

### Step 4: Update Auth Signup Form (view='auth', signup)
- [ ] Same as order form: toggle, bidirectional, optional.

### Step 5: Update Settings Form (view='settings')
- [ ] Same: toggle, bidirectional, update user on save.

### Step 6: Testing & Polish
- [ ] Test bidirectional sync.
- [ ] Test toggle off (address-only submit).
- [ ] Visual: show preview label.
- [ ] Error handling for geocoding fails.
- [ ] Update user prefill to show preview.

**Current Progress: Starting Step 1**

**Completed Steps Will Be Marked Here**
