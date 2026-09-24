# Implementation Plan

## Overview
This implementation plan addresses three bugs in the RentHub tenant dashboard:
1. Unused AccountSwitcher import in Navbar
2. Non-functional lease contract viewing and PDF generation
3. Combined "Lease & Property" tab that should be split into two separate tabs

The plan follows the bugfix workflow: Explore → Preserve → Implement → Validate

---

## Phase 1: Exploration (Bug Condition Testing)

- [x] 1. Write bug condition exploration tests (BEFORE implementing fix)
  - **Property 1: Bug Condition** - Tenant Dashboard Functionality Bugs
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failures confirm the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  
  **Test 1.1 - Unused Import Detection**
  - Manually inspect `frontend/src/components/Navbar.tsx` line 4
  - Verify the import statement `import { AccountSwitcher } from './AccountSwitcher';` exists
  - Search the entire file for any usage of `AccountSwitcher` in JSX or logic
  - **EXPECTED OUTCOME**: Import exists but is never used (confirms dead code bug)
  - Document finding: "AccountSwitcher is imported but never rendered or referenced"
  
  **Test 1.2 - View Contract Button Placeholder**
  - Start the application frontend
  - Login as a tenant user (use test credentials from seed data)
  - Navigate to the "My Lease & Property" tab in the sidebar
  - Click the "View Contract" button
  - **EXPECTED OUTCOME**: Alert popup appears with text 'Opening PDF viewer...' instead of showing LeaseContractPage
  - Document counterexample: "View Contract button triggers alert() instead of rendering lease contract"
  
  **Test 1.3 - Download PDF Button Placeholder**
  - While still on "My Lease & Property" tab
  - Click the "Download PDF" button
  - **EXPECTED OUTCOME**: Alert popup appears with text 'Downloading PDF...' with no actual PDF download
  - Document counterexample: "Download PDF button triggers alert() instead of generating PDF file"
  
  **Test 1.4 - Combined Tab Structure**
  - Observe the tenant sidebar navigation
  - Count the number of tabs related to lease/property
  - Inspect the content displayed in "My Lease & Property" tab
  - **EXPECTED OUTCOME**: Only one tab exists that combines both lease info AND property details
  - Document counterexample: "Single 'My Lease & Property' tab contains lease dates, rent amount, contract buttons, owner contact, and quick actions all together"
  
  **Test 1.5 - LeaseContractPage Component Existence**
  - Verify the file `frontend/src/pages/tenant/LeaseContractPage.tsx` exists
  - Inspect the component to confirm it's a fully functional lease contract viewer
  - Search for any usage of LeaseContractPage in DashboardPage.tsx
  - **EXPECTED OUTCOME**: Component exists but is not integrated into dashboard flow
  - Document finding: "LeaseContractPage component is implemented but never imported or rendered"
  
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

---

## Phase 2: Preservation (Before Fix)

- [~] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Dashboard Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for all non-buggy features
  - Write property-based tests capturing observed behavior patterns
  - Property-based testing generates many test cases for stronger guarantees
  
  **Test 2.1 - Navbar Navigation Preservation**
  - Observe: Click on "Explore" tab in navbar - observe navigation behavior
  - Observe: Click on "Owner Portal" tab - observe navigation behavior
  - Observe: Use search bar - observe filtering behavior
  - Observe: Click user menu - observe dropdown behavior
  - Write property test: For all navbar interactions NOT involving AccountSwitcher, navigation and UI work correctly
  - Verify test passes on UNFIXED code
  - Expected behavior: All navbar features work identically before and after fix
  
  **Test 2.2 - Dashboard Tab Preservation**
  - Observe: Navigate to "Dashboard" tab - record welcome card, quick actions, status cards rendering
  - Observe: Navigate to "Payments & Billing" tab - record payment history display
  - Observe: Navigate to "Maintenance Requests" tab - record form and request list rendering
  - Observe: Navigate to "Inbox & Notifications" tab - record messages display
  - Observe: Navigate to "Account Settings" tab - record profile form rendering
  - Write property test: For all dashboard tabs EXCEPT "My Lease & Property", rendering and functionality are preserved
  - Verify test passes on UNFIXED code
  
  **Test 2.3 - Quick Actions Preservation**
  - Observe: Click "Pay Rent" button - record that payment modal opens with correct data
  - Observe: Click "Request Maintenance" button - record navigation behavior
  - Observe: Click "Message Owner" button - record messaging trigger
  - Write property test: For all quick action buttons, handlers receive correct parameters and trigger correct behaviors
  - Verify test passes on UNFIXED code
  
  **Test 2.4 - Data Fetching Preservation**
  - Observe: Monitor network tab on page load - record API endpoints called
  - Observe: Record property data fetched and displayed
  - Observe: Record lease data fetched and displayed
  - Write property test: For all data fetching operations, the same endpoints are called with same parameters
  - Verify test passes on UNFIXED code
  
  **Test 2.5 - State Management Preservation**
  - Observe: Switch between tabs - record that sidebar state is preserved
  - Observe: Open and close modals - record state transitions
  - Observe: Input text in forms - record controlled state behavior
  - Write property test: For all state updates NOT related to lease/property tab splitting, state management works identically
  - Verify test passes on UNFIXED code
  
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

---

## Phase 3: Implementation

- [ ] 3. Fix #1: Remove unused AccountSwitcher import from Navbar

  - [~] 3.1 Remove dead code from Navbar.tsx
    - Open `frontend/src/components/Navbar.tsx`
    - Delete line 4: `import { AccountSwitcher } from './AccountSwitcher';`
    - Save the file
    - Verify no TypeScript errors appear
    - Run linter to confirm no unused import warnings
    - _Bug_Condition: component == 'Navbar' AND hasUnusedImport('AccountSwitcher')_
    - _Expected_Behavior: Import line is removed, no functional changes_
    - _Preservation: All navbar navigation elements continue to work_
    - _Requirements: 1.1, 2.1, 3.1, 3.2_

- [ ] 4. Fix #2: Implement functional lease viewing and PDF generation

  - [~] 4.1 Add PDF generation dependency
    - Open `frontend/package.json`
    - Add to dependencies section: `"jspdf": "^2.5.1"`
    - Run `bun install` to install the package
    - Verify installation completes without errors
    - _Requirements: 2.2, 2.3_

  - [~] 4.2 Import required dependencies in DashboardPage
    - Open `frontend/src/pages/tenant/DashboardPage.tsx`
    - Add import at top of file: `import { LeaseContractPage, type LeaseContract } from './LeaseContractPage';`
    - Add import: `import jsPDF from 'jspdf';`
    - Add import for FileText icon: `import { FileText } from 'lucide-react';` (if not already imported)
    - Verify no TypeScript errors
    - _Requirements: 2.2, 2.3_

  - [~] 4.3 Add state for lease contract viewing
    - In DashboardPage component, add state after existing useState declarations:
    - Add: `const [viewingLeaseContract, setViewingLeaseContract] = useState(false);`
    - Add: `const [currentLease, setCurrentLease] = useState<LeaseContract | null>(null);`
    - Verify TypeScript recognizes the LeaseContract type
    - _Requirements: 2.2_

  - [~] 4.4 Implement handleViewContract function
    - Create new function before renderTabContent():
    ```typescript
    const handleViewContract = () => {
      if (!properties || properties.length === 0) return;
      
      const property = properties[0];
      const lease: LeaseContract = {
        id: property.id || '1',
        leaseNumber: `LSE-2027-${String(property.id).padStart(5, '0')}`,
        status: 'active',
        propertyAddress: property.address || 'N/A',
        propertyType: property.propertyType || 'Residential',
        landlordName: property.ownerName || 'Property Owner',
        landlordEmail: property.ownerEmail || 'owner@renthub.com',
        landlordPhone: property.ownerPhone || 'N/A',
        tenantName: user?.name || 'Tenant',
        tenantEmail: user?.email || 'tenant@example.com',
        tenantPhone: user?.phone || 'N/A',
        startDate: property.startDate || new Date().toISOString(),
        endDate: property.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyRent: property.rent || 0,
        securityDeposit: property.securityDeposit || property.rent || 0,
        paymentDueDay: 1,
        lateFeesGracePeriod: 5,
        lateFeeAmount: 50,
        utilities: ['Tenant responsible for electricity', 'Landlord covers water'],
        petPolicy: 'No pets allowed',
        maintenanceResponsibility: 'Landlord handles major repairs',
        createdAt: property.createdAt || new Date().toISOString(),
        signedAt: property.leaseSignedAt || null,
      };
      
      setCurrentLease(lease);
      setViewingLeaseContract(true);
    };
    ```
    - Verify function compiles without errors
    - _Bug_Condition: action == 'clickViewContract' AND behavior == 'showAlert'_
    - _Expected_Behavior: handleViewContract populates lease data and sets viewing state_
    - _Requirements: 1.2, 2.2_

  - [~] 4.5 Implement handleDownloadPDF function
    - Create new function after handleViewContract:
    ```typescript
    const handleDownloadPDF = () => {
      if (!properties || properties.length === 0) return;
      
      const property = properties[0];
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Residential Lease Agreement', 20, 20);
      
      // Lease Details
      doc.setFontSize(12);
      doc.text(`Lease Number: LSE-2027-${String(property.id).padStart(5, '0')}`, 20, 35);
      doc.text(`Property: ${property.address || 'N/A'}`, 20, 45);
      doc.text(`Type: ${property.propertyType || 'Residential'}`, 20, 55);
      
      // Parties
      doc.text('LANDLORD:', 20, 70);
      doc.text(`Name: ${property.ownerName || 'Property Owner'}`, 25, 78);
      doc.text(`Email: ${property.ownerEmail || 'N/A'}`, 25, 86);
      
      doc.text('TENANT:', 20, 100);
      doc.text(`Name: ${user?.name || 'Tenant'}`, 25, 108);
      doc.text(`Email: ${user?.email || 'N/A'}`, 25, 116);
      
      // Terms
      doc.text('LEASE TERMS:', 20, 130);
      doc.text(`Start Date: ${property.startDate ? new Date(property.startDate).toLocaleDateString() : 'N/A'}`, 25, 138);
      doc.text(`End Date: ${property.endDate ? new Date(property.endDate).toLocaleDateString() : 'N/A'}`, 25, 146);
      doc.text(`Monthly Rent: $${property.rent || 0}`, 25, 154);
      doc.text(`Security Deposit: $${property.securityDeposit || property.rent || 0}`, 25, 162);
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
      
      // Save PDF
      doc.save(`lease-contract-${Date.now()}.pdf`);
    };
    ```
    - Verify function compiles without errors
    - _Bug_Condition: action == 'clickDownloadPDF' AND behavior == 'showAlert'_
    - _Expected_Behavior: handleDownloadPDF generates PDF and triggers download_
    - _Requirements: 1.3, 2.3_

  - [~] 4.6 Add conditional rendering for LeaseContractPage
    - At the beginning of the component's return statement, add:
    ```typescript
    if (viewingLeaseContract && currentLease) {
      return (
        <LeaseContractPage
          lease={currentLease}
          onBack={() => setViewingLeaseContract(false)}
          onDownload={handleDownloadPDF}
        />
      );
    }
    ```
    - Place this BEFORE the existing dashboard rendering
    - Verify TypeScript accepts the props
    - _Requirements: 2.2_

  - [~] 4.7 Update lease tab to use new handlers
    - In renderTabContent() function, find the `case 'lease':` block
    - Replace the "View Contract" button's `onClick={handleViewContract}` (remove alert)
    - Replace the "Download PDF" button's `onClick={handleDownloadPDF}` (remove alert)
    - Verify buttons now call actual functions instead of alerts
    - _Bug_Condition: Buttons trigger alert() placeholders_
    - _Expected_Behavior: Buttons call handleViewContract and handleDownloadPDF_
    - _Preservation: All other quick actions and data display work identically_
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 5. Fix #3: Split combined "Lease & Property" tab into two separate tabs

  - [~] 5.1 Update TenantSidebar to show two separate tabs
    - Open `frontend/src/components/TenantSidebar.tsx`
    - Locate the TENANT_NAV_ITEMS array
    - Find the lease item: `{ id: 'lease', label: 'My Lease & Property', icon: <Building2 className="h-5 w-5" /> }`
    - Replace with TWO separate items:
      - `{ id: 'lease', label: 'Lease Agreement', icon: <FileText className="h-5 w-5" /> }`
      - `{ id: 'property', label: 'My Property', icon: <Building2 className="h-5 w-5" /> }`
    - Ensure FileText is imported from lucide-react
    - Maintain array order: Dashboard, Lease Agreement, My Property, Payments, Maintenance, Inbox, Profile
    - Verify sidebar renders without errors
    - _Bug_Condition: tabName == 'My Lease & Property' AND combinesLeaseAndProperty == true_
    - _Expected_Behavior: Two separate tabs appear in sidebar_
    - _Requirements: 1.4, 2.4, 3.3_

  - [~] 5.2 Create separate "Lease Agreement" tab content
    - Open `frontend/src/pages/tenant/DashboardPage.tsx`
    - In renderTabContent() function, modify the existing `case 'lease':` block
    - Remove property details, owner contact, and quick actions from this view
    - Keep ONLY lease-specific content:
      - Lease start and end dates
      - Monthly rent amount
      - Security deposit amount
      - Lease agreement status (signed/unsigned)
      - "View Contract" button (with handleViewContract)
      - "Download PDF" button (with handleDownloadPDF)
    - Add empty state handling:
    ```typescript
    if (!properties || properties.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No active lease found</p>
        </div>
      );
    }
    ```
    - Verify tab renders correctly with lease-only content
    - _Expected_Behavior: Lease Agreement tab shows only contract information_
    - _Requirements: 1.5, 2.5_

  - [~] 5.3 Create new "My Property" tab content
    - In renderTabContent() function, add a new `case 'property':` block
    - Move property-related content from old combined tab:
      - Property title, address, type
      - Property owner contact information (name, email, phone)
      - Quick actions section with:
        - "Pay Rent" button (keep existing onPayRent handler)
        - "Request Maintenance" button (keep existing setActiveTab('maintenance') handler)
        - "Message Owner" button (keep existing messaging handler)
    - Preserve all existing event handlers and logic
    - Verify tab renders correctly with property-only content
    - _Expected_Behavior: My Property tab shows only property details and actions_
    - _Preservation: Quick actions work identically to before_
    - _Requirements: 1.5, 2.6, 3.7, 3.8, 3.9_

  - [~] 5.4 Verify tab switching works correctly
    - Test switching between "Lease Agreement" and "My Property" tabs
    - Verify each tab displays correct content
    - Verify no state is lost when switching tabs
    - Verify no unnecessary re-renders occur
    - _Preservation: Tab switching preserves navigation state_
    - _Requirements: 3.4_

---

## Phase 4: Validation

- [ ] 6. Verify bug condition exploration tests now pass

  - [~] 6.1 Verify unused import is removed
    - **Property 1: Expected Behavior** - Clean Imports
    - **IMPORTANT**: Re-run the SAME inspection from task 1.1 - do NOT write a new test
    - Open `frontend/src/components/Navbar.tsx`
    - Verify AccountSwitcher import is NO LONGER present
    - Run linter and verify no unused import warnings
    - Verify Navbar renders correctly
    - **EXPECTED OUTCOME**: Import is removed, no errors (confirms bug is fixed)
    - _Requirements: 2.1_

  - [~] 6.2 Verify View Contract functionality works
    - **Property 1: Expected Behavior** - Functional Lease Viewing
    - **IMPORTANT**: Re-run the SAME test from task 1.2 - do NOT write a new test
    - Login as tenant
    - Navigate to "Lease Agreement" tab
    - Click "View Contract" button
    - **EXPECTED OUTCOME**: LeaseContractPage renders with full lease agreement (no alert)
    - Verify "Back" button returns to dashboard
    - _Requirements: 2.2_

  - [~] 6.3 Verify Download PDF functionality works
    - **Property 1: Expected Behavior** - Functional PDF Generation
    - **IMPORTANT**: Re-run the SAME test from task 1.3 - do NOT write a new test
    - Navigate to "Lease Agreement" tab
    - Click "Download PDF" button
    - **EXPECTED OUTCOME**: PDF file downloads (no alert)
    - Open PDF and verify lease information is present
    - _Requirements: 2.3_

  - [~] 6.4 Verify separated tabs exist and display correct content
    - **Property 1: Expected Behavior** - Tab Separation
    - **IMPORTANT**: Re-run the SAME observations from task 1.4 - do NOT write new tests
    - Observe sidebar navigation
    - **EXPECTED OUTCOME**: Two separate tabs exist: "Lease Agreement" and "My Property"
    - Click "Lease Agreement" - verify ONLY lease info (dates, rent, buttons)
    - Click "My Property" - verify ONLY property info (details, owner, actions)
    - _Requirements: 2.4, 2.5, 2.6_

- [ ] 7. Verify preservation tests still pass

  - [~] 7.1 Verify navbar functionality preserved
    - **Property 2: Preservation** - Navbar Navigation
    - **IMPORTANT**: Re-run the SAME tests from task 2.1 - do NOT write new tests
    - Test all navbar interactions (logo, search, tabs, user menu)
    - **EXPECTED OUTCOME**: All tests pass (confirms no regressions)
    - _Requirements: 3.1, 3.2_

  - [~] 7.2 Verify dashboard tabs preserved
    - **Property 2: Preservation** - Dashboard Tabs
    - **IMPORTANT**: Re-run the SAME tests from task 2.2 - do NOT write new tests
    - Test all non-lease/property tabs (Dashboard, Payments, Maintenance, Inbox, Settings)
    - **EXPECTED OUTCOME**: All tabs render and function identically
    - _Requirements: 3.3, 3.4_

  - [~] 7.3 Verify quick actions preserved
    - **Property 2: Preservation** - Quick Actions
    - **IMPORTANT**: Re-run the SAME tests from task 2.3 - do NOT write new tests
    - Test "Pay Rent", "Request Maintenance", "Message Owner" buttons
    - **EXPECTED OUTCOME**: All handlers work identically with correct parameters
    - _Requirements: 3.7, 3.8, 3.9_

  - [~] 7.4 Verify data fetching preserved
    - **Property 2: Preservation** - API Calls
    - **IMPORTANT**: Re-run the SAME tests from task 2.4 - do NOT write new tests
    - Monitor network requests and verify same endpoints called
    - **EXPECTED OUTCOME**: Data fetching works identically
    - _Requirements: 3.5, 3.6_

  - [~] 7.5 Verify state management preserved
    - **Property 2: Preservation** - State Updates
    - **IMPORTANT**: Re-run the SAME tests from task 2.5 - do NOT write new tests
    - Test tab switching, modal state, form inputs
    - **EXPECTED OUTCOME**: All state management works identically
    - _Requirements: 3.4_

---

## Phase 5: Final Checkpoint

- [~] 8. Final verification and cleanup
  - Ensure all TypeScript compilation succeeds with no errors
  - Ensure linter passes with no warnings
  - Verify all three bugs are fixed:
    ✓ Unused import removed
    ✓ Lease viewing and PDF download functional
    ✓ Tabs separated correctly
  - Verify all preservation tests pass (no regressions)
  - Test edge cases:
    - No active lease scenario displays empty state
    - Missing lease data fields handled gracefully in PDF
    - Mobile responsiveness maintained
  - Ask user if any questions or issues arise before marking complete

