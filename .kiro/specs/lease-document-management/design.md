# Design Document: Lease Document Management System

## Overview

The Lease Document Management System extends RentHub with comprehensive PDF document handling capabilities, enabling property owners and tenants to upload, generate, view, and digitally sign lease agreements. The system integrates seamlessly with the existing React/TypeScript frontend, Node.js/Bun backend, and PostgreSQL/Prisma database stack.

### Core Capabilities

- **PDF Upload**: Drag-and-drop and file selection upload with validation and progress tracking
- **Secure Storage**: File system-based PDF storage with database metadata tracking
- **In-Browser Viewing**: Client-side PDF rendering with navigation and zoom controls
- **Lease Generation**: Automated lease PDF creation from property and tenant data
- **Digital Signatures**: Canvas-based and typed signature capture with audit trail
- **Status Tracking**: Multi-party signing workflow with status management
- **Access Control**: Role-based permissions for document operations
- **Terminology Update**: Replace "Landlord" with "Property Owner" throughout the system

### Design Principles

1. **Security-First**: Server-side timestamp generation, IP capture from headers, immutable audit logs
2. **Integration-Native**: Leverage existing authentication, database schema, and API patterns
3. **User-Centric**: Responsive UI with clear error messages and loading states
4. **Performance-Aware**: File size limits, pagination, and efficient query patterns
5. **Audit-Ready**: Comprehensive logging for compliance and troubleshooting

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  React + TypeScript + TailwindCSS + Lucide Icons               │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                     │
│  • PDFUploadZone    • LeaseGenerator    • SignatureCanvas      │
│  • PDFViewer        • DocumentList       • LeasePreview         │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS/JSON
                     │ JWT Bearer Auth
┌────────────────────▼────────────────────────────────────────────┐
│                         API Layer                               │
│  Node.js + Express + Bun Runtime                                │
├─────────────────────────────────────────────────────────────────┤
│  Routes:                                                         │
│  • /api/documents/*  • /api/leases/*                           │
│                                                                  │
│  Controllers:                                                    │
│  • documents.controller.ts  • leases.controller.ts             │
│                                                                  │
│  Middleware:                                                     │
│  • loadUserFromHeader (JWT validation)                         │
│  • validate (Zod schema validation)                            │
│  • multer (file upload handling)                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────────┐  ┌──────▼──────────────────────────────────┐
│  File System       │  │     PostgreSQL Database                 │
│  Storage           │  │     (via Prisma ORM)                    │
├────────────────────┤  ├─────────────────────────────────────────┤
│ /uploads/documents/│  │ Tables:                                 │
│   {uuid}.pdf       │  │ • lease_documents                       │
│                    │  │ • document_signatures                   │
│ Permissions:       │  │ • properties (existing)                 │
│ • 0600 (owner-only)│  │ • users (existing)                      │
│                    │  │ • rental_applications (existing)        │
└────────────────────┘  └─────────────────────────────────────────┘
```

### Technology Stack

| Layer           | Technology                                      |
|-----------------|-------------------------------------------------|
| **Frontend**    | React 19, TypeScript 6, TailwindCSS 4, Vite 8  |
| **Backend**     | Node.js, Express 5, Bun runtime                 |
| **Database**    | PostgreSQL 16+ with Prisma 7 ORM                |
| **PDF Library** | pdf-lib (generation), pdfjs-dist (viewing)      |
| **Signature**   | signature_pad (canvas drawing)                  |
| **Storage**     | Local filesystem with database metadata         |
| **Auth**        | Existing JWT-based authentication               |

---

## Components and Interfaces

### Frontend Components

#### 1. PDFUploadZone

**Purpose**: Drag-and-drop and file selection interface for PDF uploads

**Props**:
```typescript
interface PDFUploadZoneProps {
  propertyId?: string;           // Optional property association
  onUploadSuccess: (docId: string) => void;
  onUploadError: (error: string) => void;
  maxSizeMB?: number;            // Default: 10
  disabled?: boolean;
}
```

**Key Features**:
- Drag-and-drop activation on drag enter/over
- File type validation (application/pdf only)
- File size validation (configurable, default 10MB)
- Upload progress indicator (percentage)
- Error display with retry button
- Multiple file upload support

**Implementation Notes**:
- Use `<input type="file" accept=".pdf" multiple>` with hidden input
- Validate file type using `file.type === 'application/pdf'`
- Use `FormData` for multipart upload
- Track upload progress with `XMLHttpRequest.upload.onprogress`

#### 2. PDFViewer

**Purpose**: In-browser PDF rendering with navigation controls

**Props**:
```typescript
interface PDFViewerProps {
  documentId: string;
  onError?: (error: string) => void;
  showToolbar?: boolean;         // Default: true
  initialZoom?: number;          // Default: 1.0
}
```

**Key Features**:
- Page navigation (prev/next/jump to page)
- Zoom controls (in/out/fit-to-width/fit-to-page)
- Current page / total pages display
- Loading skeleton with spinner
- Error boundary with retry
- Responsive canvas rendering

**Implementation**:
```typescript
// Using pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';

const loadPDF = async (url: string) => {
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  return pdf;
};

const renderPage = async (pdf: PDFDocumentProxy, pageNum: number, canvas: HTMLCanvasElement) => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: zoom });
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const renderContext = {
    canvasContext: canvas.getContext('2d')!,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
};
```

#### 3. LeaseGenerator

**Purpose**: Form interface to create lease PDFs from property and tenant data

**Props**:
```typescript
interface LeaseGeneratorProps {
  propertyId: string;
  applicantId: string;
  applicationData: RentalApplicationData;
  onGenerateSuccess: (leaseId: string) => void;
  onGenerateError: (error: string) => void;
}
```

**Form Fields**:
- Start Date (date picker, min: tomorrow)
- End Date (date picker, calculated from duration or manual)
- Lease Duration (auto-calculated or selectable: 6/12/24 months)
- Payment Day (1-31, day of month for rent payment)
- Security Deposit (pre-filled from property, editable)
- Additional Terms (textarea for custom clauses)

**Validation**:
- Start date must be in the future
- End date must be after start date
- Payment day must be valid for all months (1-28 safe, warn for 29-31)

#### 4. SignatureCanvas

**Purpose**: Digital signature capture component

**Props**:
```typescript
interface SignatureCanvasProps {
  documentId: string;
  signerName: string;
  signerEmail: string;
  onSignSuccess: () => void;
  onSignError: (error: string) => void;
}
```

**Modes**:
1. **Canvas Drawing**: Using signature_pad library
   - Smooth pen drawing with touch/mouse support
   - Clear button to restart
   - Preview before submission
   
2. **Typed Signature**: Text-based signature
   - Input field with signer full name
   - Styled with cursive font (e.g., "Brush Script MT", "Lucida Handwriting")
   - Preview with underline

**Workflow**:
```typescript
const handleSign = async () => {
  // 1. Show consent dialog
  const consent = await showConsentDialog();
  if (!consent) return;
  
  // 2. Capture signature data
  const signatureData = mode === 'draw' 
    ? canvas.toDataURL('image/png')
    : typedName;
  
  // 3. Submit to API
  const response = await fetch('/api/documents/${documentId}/sign', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      tenantId: userId,
      tenantName: signerName,
      tenantEmail: signerEmail,
      signatureData,
      agreed: true,
    }),
  });
  
  if (response.ok) {
    onSignSuccess();
  } else {
    const error = await response.json();
    onSignError(error.message);
  }
};
```

#### 5. DocumentList

**Purpose**: List and filter user's documents with status

**Props**:
```typescript
interface DocumentListProps {
  userId: string;
  userRole: 'OWNER' | 'TENANT' | 'SUPERADMIN';
  onDocumentClick: (docId: string) => void;
}
```

**Features**:
- Table view with columns: Property, Tenant, Type, Upload Date, Status, Actions
- Sort by: Upload Date (desc/asc), Property Name (A-Z)
- Filter by: Status (pending/signed/completed), Property, Document Type
- Pagination (50 per page)
- Search by property name or tenant name
- Action buttons: View, Download, Sign (if pending)

**State Management**:
```typescript
const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
const [filters, setFilters] = useState({ status: 'all', propertyId: 'all' });
const [sortBy, setSortBy] = useState<'date' | 'property'>('date');
const [page, setPage] = useState(1);
const [loading, setLoading] = useState(false);
```

#### 6. LeasePreview

**Purpose**: Preview generated lease before finalizing

**Props**:
```typescript
interface LeasePreviewProps {
  leaseData: LeaseGenerationData;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}
```

**Display**:
- Formatted lease text preview
- Highlighted key terms (property, tenant, dates, rent)
- Edit button to go back to form
- Confirm button to finalize and save
- Warning: "This will create a binding lease agreement"

---

## Data Models

### Database Schema

#### Table: lease_documents

```sql
CREATE TABLE lease_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Document metadata
  document_type VARCHAR(50) NOT NULL DEFAULT 'lease_agreement',
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  
  -- Lease-specific fields
  lease_start_date DATE,
  lease_end_date DATE,
  monthly_rent DECIMAL(12, 2),
  security_deposit DECIMAL(12, 2),
  payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31),
  
  -- Timestamps
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (lease_end_date > lease_start_date)
);

-- Indexes for performance
CREATE INDEX idx_lease_docs_property ON lease_documents(property_id);
CREATE INDEX idx_lease_docs_tenant ON lease_documents(tenant_id);
CREATE INDEX idx_lease_docs_owner ON lease_documents(owner_id);
CREATE INDEX idx_lease_docs_uploaded_at ON lease_documents(uploaded_at DESC);
```

#### Table: document_signatures

```sql
CREATE TABLE document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  document_id UUID NOT NULL REFERENCES lease_documents(id) ON DELETE CASCADE,
  signer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Signer information
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  
  -- Signature data
  signature_data TEXT NOT NULL,  -- Base64 image or typed text
  signature_type VARCHAR(20) NOT NULL DEFAULT 'drawn',  -- 'drawn' or 'typed'
  
  -- Audit trail (server-captured, never from client)
  signed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  signer_ip VARCHAR(45) NOT NULL,  -- IPv6-compatible
  user_agent TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  
  -- Prevent multiple signatures per document per user
  UNIQUE(document_id, signer_user_id)
);

-- Indexes
CREATE INDEX idx_doc_sigs_document ON document_signatures(document_id);
CREATE INDEX idx_doc_sigs_user ON document_signatures(signer_user_id);
CREATE INDEX idx_doc_sigs_signed_at ON document_signatures(signed_at DESC);
```

### Prisma Schema Addition

```prisma
model LeaseDocument {
  id                   String   @id @default(uuid()) @db.Uuid
  property_id          String   @db.Uuid @map("property_id")
  tenant_id            String   @db.Uuid @map("tenant_id")
  owner_id             String   @db.Uuid @map("owner_id")
  document_type        String   @default("lease_agreement") @map("document_type")
  original_filename    String   @map("original_filename")
  file_path            String   @map("file_path")
  file_size_bytes      BigInt   @map("file_size_bytes")
  lease_start_date     DateTime? @map("lease_start_date") @db.Date
  lease_end_date       DateTime? @map("lease_end_date") @db.Date
  monthly_rent         Decimal? @db.Decimal(12, 2) @map("monthly_rent")
  security_deposit     Decimal? @db.Decimal(12, 2) @map("security_deposit")
  payment_day          Int?     @map("payment_day")
  uploaded_at          DateTime @default(now()) @map("uploaded_at")
  uploaded_by_user_id  String   @db.Uuid @map("uploaded_by_user_id")

  property             Property @relation("PropertyDocuments", fields: [property_id], references: [id], onDelete: Cascade)
  tenant               User     @relation("TenantDocuments", fields: [tenant_id], references: [id], onDelete: Cascade)
  owner                User     @relation("OwnerDocuments", fields: [owner_id], references: [id], onDelete: Cascade)
  uploader             User     @relation("UploadedDocuments", fields: [uploaded_by_user_id], references: [id])
  signatures           DocumentSignature[] @relation("DocumentSignatures")

  @@map("lease_documents")
  @@index([property_id])
  @@index([tenant_id])
  @@index([owner_id])
  @@index([uploaded_at])
}

model DocumentSignature {
  id              String        @id @default(uuid()) @db.Uuid
  document_id     String        @db.Uuid @map("document_id")
  signer_user_id  String        @db.Uuid @map("signer_user_id")
  signer_name     String        @map("signer_name")
  signer_email    String        @map("signer_email")
  signature_data  String        @map("signature_data")
  signature_type  String        @default("drawn") @map("signature_type")
  signed_at       DateTime      @default(now()) @map("signed_at")
  signer_ip       String        @map("signer_ip")
  user_agent      String?       @map("user_agent")
  status          String        @default("completed")

  document        LeaseDocument @relation("DocumentSignatures", fields: [document_id], references: [id], onDelete: Cascade)
  signer          User          @relation("SignedDocuments", fields: [signer_user_id], references: [id], onDelete: Cascade)

  @@unique([document_id, signer_user_id])
  @@map("document_signatures")
  @@index([document_id])
  @@index([signer_user_id])
  @@index([signed_at])
}
```

### Migration Script

```prisma
-- CreateTable for lease_documents
CREATE TABLE "lease_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "property_id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "document_type" TEXT NOT NULL DEFAULT 'lease_agreement',
  "original_filename" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size_bytes" BIGINT NOT NULL,
  "lease_start_date" DATE,
  "lease_end_date" DATE,
  "monthly_rent" DECIMAL(12,2),
  "security_deposit" DECIMAL(12,2),
  "payment_day" INTEGER,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploaded_by_user_id" UUID NOT NULL,

  CONSTRAINT "lease_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "valid_dates" CHECK ("lease_end_date" > "lease_start_date"),
  CONSTRAINT "valid_payment_day" CHECK ("payment_day" BETWEEN 1 AND 31)
);

-- CreateTable for document_signatures
CREATE TABLE "document_signatures" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "signer_user_id" UUID NOT NULL,
  "signer_name" TEXT NOT NULL,
  "signer_email" TEXT NOT NULL,
  "signature_data" TEXT NOT NULL,
  "signature_type" TEXT NOT NULL DEFAULT 'drawn',
  "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signer_ip" TEXT NOT NULL,
  "user_agent" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',

  CONSTRAINT "document_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_lease_docs_property" ON "lease_documents"("property_id");
CREATE INDEX "idx_lease_docs_tenant" ON "lease_documents"("tenant_id");
CREATE INDEX "idx_lease_docs_owner" ON "lease_documents"("owner_id");
CREATE INDEX "idx_lease_docs_uploaded_at" ON "lease_documents"("uploaded_at" DESC);
CREATE INDEX "idx_doc_sigs_document" ON "document_signatures"("document_id");
CREATE INDEX "idx_doc_sigs_user" ON "document_signatures"("signer_user_id");
CREATE INDEX "idx_doc_sigs_signed_at" ON "document_signatures"("signed_at" DESC);

-- CreateUnique
CREATE UNIQUE INDEX "document_signatures_document_id_signer_user_id_key" ON "document_signatures"("document_id", "signer_user_id");

-- AddForeignKey
ALTER TABLE "lease_documents" ADD CONSTRAINT "lease_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease_documents" ADD CONSTRAINT "lease_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease_documents" ADD CONSTRAINT "lease_documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease_documents" ADD CONSTRAINT "lease_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "lease_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_signer_user_id_fkey" FOREIGN KEY ("signer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## API Endpoints

### Document Management Endpoints

#### POST /api/documents/upload

Upload a PDF document

**Request**:
```
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}

Body:
  file: (binary PDF file)
  propertyId: (optional UUID)
  tenantId: (optional UUID)
  documentType: 'lease_agreement' | 'addendum' | 'notice' | 'other'
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": {
    "id": "uuid",
    "originalFilename": "lease.pdf",
    "fileSizeBytes": 245678,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "documentType": "lease_agreement"
  }
}
```

**Errors**:
- 400: Invalid file type or size exceeds limit
- 401: Missing or invalid authentication token
- 500: Server error during upload

#### GET /api/documents/:id

Retrieve a specific document's metadata

**Request**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "propertyTitle": "Modern Apartment in Bole",
  "tenantId": "uuid",
  "tenantName": "John Doe",
  "ownerId": "uuid",
  "ownerName": "Jane Smith",
  "documentType": "lease_agreement",
  "originalFilename": "lease.pdf",
  "fileSizeBytes": 245678,
  "leaseStartDate": "2024-02-01",
  "leaseEndDate": "2025-02-01",
  "monthlyRent": 15000.00,
  "uploadedAt": "2024-01-15T10:30:00Z",
  "signingStatus": "pending",
  "signatures": []
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (user doesn't have access)
- 404: Document not found

#### GET /api/documents/:id/download

Download the PDF file

**Request**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="lease_property_tenant.pdf"

(binary PDF data)
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Document not found

#### GET /api/documents/list

List documents for authenticated user

**Query Parameters**:
```
?status=pending|signed|completed
&propertyId=uuid
&documentType=lease_agreement|addendum|notice
&sortBy=date|property
&sortOrder=asc|desc
&page=1
&limit=50
```

**Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "uuid",
      "propertyTitle": "Modern Apartment",
      "tenantName": "John Doe",
      "documentType": "lease_agreement",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "signingStatus": "pending"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 123,
    "pages": 3
  }
}
```

#### GET /api/documents/:id/share

Generate a shareable link for the document

**Request**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "shareUrl": "https://renthub.com/shared/documents/{token}",
  "expiresAt": "2024-01-22T10:30:00Z",
  "token": "secure_random_token"
}
```

**Note**: Shareable links expire after 7 days and require no authentication

### Lease Generation Endpoints

#### POST /api/leases/generate

Generate a lease PDF from property and tenant data

**Request**:
```json
{
  "propertyId": "uuid",
  "tenantId": "uuid",
  "applicationId": "uuid",
  "leaseStartDate": "2024-02-01",
  "leaseEndDate": "2025-02-01",
  "monthlyRent": 15000.00,
  "securityDeposit": 15000.00,
  "paymentDay": 1,
  "additionalTerms": "No pets allowed. Smoking prohibited."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Lease agreement generated successfully",
  "lease": {
    "documentId": "uuid",
    "propertyTitle": "Modern Apartment in Bole",
    "tenantName": "John Doe",
    "startDate": "2024-02-01",
    "endDate": "2025-02-01",
    "monthlyRent": 15000.00,
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors**:
- 400: Missing required fields or invalid data
- 403: User not authorized to generate lease for this property
- 404: Property or tenant not found

### Signature Endpoints

#### POST /api/documents/:id/sign

Digitally sign a document

**Request**:
```json
{
  "documentId": "uuid",
  "tenantId": "uuid",
  "tenantName": "John Doe",
  "tenantEmail": "john@example.com",
  "signatureData": "data:image/png;base64,iVBOR...",
  "signatureType": "drawn",
  "agreed": true
}
```

**Response** (200 OK):
```json
{
  "message": "Contract signed and legally executed",
  "executedDocument": {
    "id": "uuid",
    "propertyId": "uuid",
    "tenantId": "uuid",
    "status": "signed",
    "signedAt": "2024-01-15T10:35:00Z",
    "signerIp": "192.168.1.100",
    "signerName": "John Doe"
  },
  "auditRecord": {
    "signerIp": "192.168.1.100",
    "signedAt": "2024-01-15T10:35:00Z",
    "tenantName": "John Doe",
    "tenantEmail": "john@example.com"
  }
}
```

**Errors**:
- 400: Invalid signature data or missing required fields
- 403: User not authorized to sign this document
- 409: Document already signed
- 404: Document not found

---

## PDF Handling

### Library Selection

#### PDF Generation: pdf-lib

**Rationale**:
- Pure JavaScript, works in Node.js environment
- Supports creating PDFs from scratch
- Text rendering with custom fonts
- Image embedding (for signature overlays)
- Page layout control
- No external dependencies

**Installation**:
```bash
cd backend
bun add pdf-lib
```

#### PDF Viewing: pdfjs-dist

**Rationale**:
- Official Mozilla PDF rendering library
- Canvas-based rendering
- Excellent browser support
- Worker thread support for performance
- Used by Firefox internally

**Installation**:
```bash
cd frontend
bun add pdfjs-dist
```

### Storage Strategy

**Location**: Local filesystem (expandable to S3/Cloudinary later)

**Directory Structure**:
```
backend/
  uploads/
    documents/
      {year}/
        {month}/
          {uuid}.pdf
```

**File Naming**: `{uuid}.pdf` (document ID from database)

**Permissions**:
- Directory: `0755` (rwxr-xr-x)
- Files: `0600` (rw-------) - owner only

**Security**:
- Files stored outside web server document root
- Access only through API endpoints with authentication
- Original filenames stored in database, not used for storage
- Path traversal protection via UUID-only naming

### PDF Generation Process

**Workflow**:

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function generateLeasePDF(leaseData: LeaseData): Promise<Buffer> {
  // 1. Create new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  // 2. Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // 3. Add title
  const title = 'RESIDENTIAL LEASE AGREEMENT';
  page.drawText(title, {
    x: 50,
    y: 750,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // 4. Add content sections
  let yPosition = 700;
  const lineHeight = 20;
  
  const sections = [
    { label: 'Property Owner:', value: leaseData.ownerName },
    { label: 'Tenant:', value: leaseData.tenantName },
    { label: 'Property:', value: leaseData.propertyTitle },
    { label: 'Address:', value: leaseData.propertyAddress },
    { label: 'Monthly Rent:', value: `$${leaseData.monthlyRent} USD` },
    { label: 'Lease Period:', value: `${leaseData.startDate} to ${leaseData.endDate}` },
  ];
  
  for (const section of sections) {
    page.drawText(`${section.label}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    page.drawText(section.value, {
      x: 200,
      y: yPosition,
      size: 12,
      font: font,
    });
    yPosition -= lineHeight;
  }
  
  // 5. Add lease terms paragraph
  yPosition -= 20;
  const termsText = `Owner agrees to lease the property '${leaseData.propertyTitle}' to ${leaseData.tenantName} for ${leaseData.duration} commencing on ${leaseData.startDate} and concluding on ${leaseData.endDate}. Monthly rental consideration: $${leaseData.monthlyRent} USD, payable on the ${leaseData.paymentDay} of each calendar month.`;
  
  page.drawText(termsText, {
    x: 50,
    y: yPosition,
    size: 11,
    font: font,
    maxWidth: 500,
    lineHeight: 15,
  });
  
  // 6. Add additional terms if provided
  if (leaseData.additionalTerms) {
    yPosition -= 100;
    page.drawText('Additional Terms:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    });
    yPosition -= 20;
    page.drawText(leaseData.additionalTerms, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
      maxWidth: 500,
      lineHeight: 15,
    });
  }
  
  // 7. Add signature placeholders
  yPosition = 200;
  page.drawText('_________________________', {
    x: 50,
    y: yPosition,
    size: 12,
    font: font,
  });
  page.drawText('Owner Signature', {
    x: 50,
    y: yPosition - 15,
    size: 10,
    font: font,
  });
  
  page.drawText('_________________________', {
    x: 350,
    y: yPosition,
    size: 12,
    font: font,
  });
  page.drawText('Tenant Signature', {
    x: 350,
    y: yPosition - 15,
    size: 10,
    font: font,
  });
  
  // 8. Add footer
  page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 50,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // 9. Serialize to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
```

### Signature Overlay Technique

**Process**:

1. **Capture signature** on frontend (canvas or typed)
2. **Convert to base64** image data
3. **Send to backend** with signature API call
4. **Store in database** (audit log)
5. **Optional: Overlay on PDF** (for visual representation)

**Overlay Implementation** (future enhancement):

```typescript
import { PDFDocument } from 'pdf-lib';

async function overlaySignature(
  pdfPath: string,
  signatureImageBase64: string,
  position: { x: number; y: number; page: number }
): Promise<Buffer> {
  // 1. Load existing PDF
  const existingPdfBytes = await fs.promises.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // 2. Embed signature image
  const signatureImage = await pdfDoc.embedPng(signatureImageBase64);
  
  // 3. Get target page
  const page = pdfDoc.getPage(position.page);
  
  // 4. Draw signature
  page.drawImage(signatureImage, {
    x: position.x,
    y: position.y,
    width: 150,
    height: 50,
  });
  
  // 5. Save modified PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
```

**Note**: Initial implementation stores signatures in database only. PDF overlay is optional enhancement for visual representation.

---

## Terminology Updates

### Files Requiring Changes

#### Frontend Files

1. **src/components/RentalApplicationModal.tsx**
   - Line references to "landlord" → "property owner"
   
2. **src/pages/OwnerDashboard.tsx** (if exists)
   - Page title and headers
   
3. **src/pages/PropertyListing.tsx**
   - "Landlord" labels → "Owner" or "Property Owner"
   
4. **src/types/index.ts**
   - Type definitions and interfaces
   
5. **src/components/PropertyCard.tsx**
   - Owner display labels

#### Backend Files

1. **backend/controllers/properties.controller.ts**
   - API response field names (if any reference "landlord")
   
2. **backend/schemas/property.schema.ts**
   - Schema descriptions and error messages

#### Database

**Note**: The existing schema already uses `owner_id` and `OWNER` role, so no database changes needed.

### Replacement Mapping

| Old Term          | New Term(s)                    | Context                          |
|-------------------|--------------------------------|----------------------------------|
| Landlord          | Property Owner                 | Formal, legal contexts           |
| Landlord          | Owner                          | Casual, UI labels                |
| Landlord's        | Owner's                        | Possessive forms                 |
| Landlord info     | Owner information              | Headings, sections               |
| Contact landlord  | Contact property owner         | Buttons, actions                 |
| Landlord details  | Property owner details         | Forms, data displays             |

### Implementation Script

```typescript
// scripts/update-terminology.ts
import * as fs from 'fs';
import * as path from 'path';

const replacements = [
  { from: /\bLandlord\b/g, to: 'Property Owner' },
  { from: /\blandlord\b/g, to: 'property owner' },
  { from: /\bLandlord's\b/g, to: "Owner's" },
  { from: /\blandlord's\b/g, to: "owner's" },
];

const filesToUpdate = [
  'frontend/src/components/RentalApplicationModal.tsx',
  'frontend/src/pages/OwnerDashboard.tsx',
  'frontend/src/types/index.ts',
  // ... add more files
];

function updateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Updated ${filePath}`);
}

filesToUpdate.forEach(updateFile);
```

---

## Security Design

### Authentication & Authorization Flow

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. Request with JWT
       │    Authorization: Bearer eyJhbGc...
       ▼
┌─────────────────────────────────────────┐
│  Middleware: loadUserFromHeader         │
│  • Extract token from Authorization     │
│  • Verify JWT signature                 │
│  • Decode payload (userId, role, email) │
│  • Attach user to req.user              │
└──────┬──────────────────────────────────┘
       │ 2. User authenticated
       ▼
┌─────────────────────────────────────────┐
│  Controller: checkDocumentAccess        │
│  • Load document from database          │
│  • Check: user is owner OR tenant       │
│  • Check: role-based permissions        │
└──────┬──────────────────────────────────┘
       │ 3. Authorized
       ▼
┌─────────────────────────────────────────┐
│  Service: performOperation              │
│  • Execute requested operation          │
│  • Log audit trail                      │
└──────┬──────────────────────────────────┘
       │ 4. Return response
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

### Access Control Matrix

| Role        | Upload | View Own | View All | Sign | Delete Own | Delete All |
|-------------|--------|----------|----------|------|------------|------------|
| TENANT      | No     | Yes      | No       | Yes  | No         | No         |
| OWNER       | Yes    | Yes      | No       | No   | Yes        | No         |
| SUPERADMIN  | Yes    | Yes      | Yes      | Yes  | Yes        | Yes        |

**Additional Rules**:
- Tenants can only view documents where they are the named tenant
- Owners can only view documents for their properties
- Tenants can only sign documents where they are the tenant
- Document deletion requires owner + document not signed yet

### File Upload Validation

**Security Checks** (in order):

1. **Authentication**: JWT token present and valid
2. **File Type**: MIME type is `application/pdf`
3. **File Size**: Does not exceed 10 MB (10,485,760 bytes)
4. **Magic Bytes**: File header starts with `%PDF-` (hex: 25 50 44 46)
5. **Filename Sanitization**: Remove path traversal characters (`../`, `..\\`)
6. **Unique Naming**: Use UUID, never user-provided filename for storage

**Implementation**:

```typescript
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// File filter for multer
const pdfFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new Error('File must have .pdf extension'), false);
  }
  
  cb(null, true);
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(__dirname, '..', 'uploads', 'documents', String(year), month);
    
    // Ensure directory exists
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate UUID for filename
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}.pdf`);
  },
});

// Multer configuration
export const uploadPDF = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Additional magic bytes validation (in controller)
async function validatePDFMagicBytes(filePath: string): Promise<boolean> {
  const buffer = await fs.promises.readFile(filePath, { encoding: null });
  const header = buffer.slice(0, 5).toString('utf-8');
  return header === '%PDF-';
}
```

### Audit Logging Strategy

**What to Log**:

1. **Document Operations**:
   - Upload (user, document ID, filename, size, timestamp)
   - View (user, document ID, timestamp, IP)
   - Download (user, document ID, timestamp, IP)
   - Delete (user, document ID, timestamp)

2. **Signature Operations**:
   - Sign attempt (user, document ID, timestamp, IP, user agent)
   - Sign success (user, document ID, timestamp, IP)
   - Sign failure (user, document ID, reason, timestamp, IP)

3. **Security Events**:
   - Unauthorized access attempt (user, resource, timestamp, IP)
   - Invalid file upload (user, reason, timestamp)
   - Authentication failure (IP, timestamp, reason)

**Log Storage**:
- Console logs (captured by server logs)
- Database table: `audit_logs` (for queryable history)
- Optional: External logging service (e.g., Winston + CloudWatch)

**Implementation**:

```typescript
// lib/audit-logger.ts
import prisma from './prisma';

interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  status: 'success' | 'failure';
  details?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    // Log to console
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      ...entry,
    });
    
    // Optional: Store in database
    // await prisma.auditLog.create({ data: entry });
  } catch (error) {
    console.error('[AUDIT] Failed to log:', error);
  }
}

// Usage in controller
await logAudit({
  userId: req.user.id,
  action: 'DOCUMENT_UPLOAD',
  resourceType: 'lease_document',
  resourceId: document.id,
  ipAddress: req.ip || 'unknown',
  userAgent: req.headers['user-agent'],
  status: 'success',
});
```

### Encryption Strategy

**At Rest**:
- **Database**: PostgreSQL's built-in encryption (configure at deployment)
- **Filesystem**: OS-level encryption (e.g., LUKS, BitLocker)
- **Sensitive Fields**: Encrypt signature data using AES-256 (future enhancement)

**In Transit**:
- **HTTPS**: All API endpoints served over TLS 1.2+
- **Certificate**: Let's Encrypt or commercial SSL certificate
- **Strict Transport Security**: HTTP header enforces HTTPS

**Implementation Note**: Initial deployment uses standard filesystem storage. Encryption at rest can be added via:

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## Integration Points

### Rental Application Workflow

**Current Flow** (from `applications.controller.ts`):

```
1. Tenant submits application
   POST /api/applications/submit
   → Creates rental_applications record (status: pending)

2. Owner reviews application
   GET /api/applications/owner/:ownerId
   → Lists all applications for owner's properties

3. Owner approves/rejects
   PATCH /api/applications/:id/status
   → Updates status to 'approved' or 'rejected'
```

**Enhanced Flow with Document Management**:

```
1. Tenant submits application
   [Same as above]

2. Owner reviews application
   [Same as above]

3. Owner approves application
   PATCH /api/applications/:id/status
   → status: 'approved'
   → reviewed_at: timestamp

4. Owner generates lease document ← NEW
   POST /api/leases/generate
   Body: {
     applicationId: "{id}",
     propertyId: "{from application}",
     tenantId: "{from application}",
     leaseStartDate: "2024-02-01",
     leaseEndDate: "2025-02-01",
     ...
   }
   → Fetches property data from properties table
   → Fetches tenant data from users table
   → Fetches application data from rental_applications table
   → Generates PDF using pdf-lib
   → Stores PDF in filesystem
   → Creates lease_documents record
   → Returns documentId

5. System notifies tenant ← NEW
   → Email: "Your lease agreement is ready for review"
   → In-app notification

6. Tenant views and signs lease ← NEW
   GET /api/documents/:id → View in browser
   POST /api/documents/:id/sign → Digital signature
   → Creates document_signatures record
   → Updates lease_documents status

7. System notifies owner ← NEW
   → Email: "Tenant has signed the lease"
   → In-app notification

8. Lease becomes active
   → Both parties can download signed PDF
   → Property status updated to 'rented'
```

### Data Retrieval Patterns

#### From Properties Table

```typescript
// Fetch property data for lease generation
const property = await prisma.property.findUnique({
  where: { id: propertyId },
  select: {
    id: true,
    title: true,
    address: true,
    city: true,
    subcity: true,
    rent_amount: true,
    security_deposit: true,
    owner_id: true,
    owner: {
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
      },
    },
  },
});
```

#### From Users Table

```typescript
// Fetch tenant data for lease generation
const tenant = await prisma.user.findUnique({
  where: { id: tenantId },
  select: {
    id: true,
    full_name: true,
    email: true,
    phone: true,
  },
});
```

#### From Rental Applications Table

```typescript
// Fetch application data to pre-fill lease
const application = await prisma.rentalApplication.findUnique({
  where: { id: applicationId },
  select: {
    id: true,
    property_id: true,
    applicant_id: true,
    full_name: true,
    email: true,
    phone: true,
    move_in_date: true,
    monthly_income: true,
    number_of_occupants: true,
    occupation: true,
    employer: true,
  },
});

// Use move_in_date as default lease start date
const leaseStartDate = application.move_in_date;
```

### API Routing Integration

**Existing Pattern** (from `routes/index.ts`):

```typescript
// Properties
router.post('/properties', loadUserFromHeader, validate(createPropertySchema), createProperty);

// Applications
router.post('/applications/submit', loadUserFromHeader, submitApplication);
```

**New Routes** (following same pattern):

```typescript
// backend/routes/index.ts additions

import { 
  uploadDocument, 
  getDocument, 
  listDocuments, 
  downloadDocument,
  deleteDocument 
} from '../controllers/documents.controller';

import { 
  generateLease 
} from '../controllers/leases.controller';

import { 
  signDocument 
} from '../controllers/documents.controller';

import { uploadPDF } from '../middleware/upload.middleware';
import { documentSchemas } from '../schemas/document.schema';

// Documents
router.post(
  '/documents/upload',
  loadUserFromHeader,
  uploadPDF.single('file'),
  uploadDocument
);

router.get(
  '/documents/:id',
  loadUserFromHeader,
  validate(documentSchemas.documentId),
  getDocument
);

router.get(
  '/documents/list',
  loadUserFromHeader,
  validate(documentSchemas.listQuery),
  listDocuments
);

router.get(
  '/documents/:id/download',
  loadUserFromHeader,
  validate(documentSchemas.documentId),
  downloadDocument
);

router.delete(
  '/documents/:id',
  loadUserFromHeader,
  validate(documentSchemas.documentId),
  deleteDocument
);

// Leases
router.post(
  '/leases/generate',
  loadUserFromHeader,
  validate(documentSchemas.generateLease),
  generateLease
);

// Signatures
router.post(
  '/documents/:id/sign',
  loadUserFromHeader,
  validate(documentSchemas.signDocument),
  signDocument
);
```

### JWT Authentication Usage

**Token Structure** (from existing system):

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "OWNER" | "TENANT" | "SUPERADMIN",
  "iat": 1705324800,
  "exp": 1705411200
}
```

**Middleware Usage** (existing `loadUserFromHeader`):

```typescript
// Request flow
Request → loadUserFromHeader → Controller

// In controller, access user data
const userId = req.user.id;
const userRole = req.user.role;
const userEmail = req.user.email;

// Authorization checks
if (userRole !== 'OWNER') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## User Workflows

### 1. Owner Uploads Custom Lease Template

```mermaid
sequenceDiagram
    actor Owner
    participant UI as Frontend
    participant API as Backend API
    participant FS as File System
    participant DB as Database

    Owner->>UI: Navigate to Documents page
    Owner->>UI: Click "Upload Document"
    UI->>Owner: Show upload modal
    Owner->>UI: Drag PDF file / Select file
    UI->>UI: Validate file (PDF, <10MB)
    UI->>API: POST /api/documents/upload<br/>(multipart/form-data)
    API->>API: Validate JWT token
    API->>API: Validate file type & size
    API->>FS: Save PDF to /uploads/documents/{year}/{month}/{uuid}.pdf
    API->>DB: INSERT INTO lease_documents
    API->>UI: Return document metadata
    UI->>Owner: Show success message
    Owner->>UI: View document in list
```

**Steps**:
1. Owner navigates to "Documents" page
2. Clicks "Upload Document" button
3. Modal appears with drag-drop zone
4. Owner drags PDF or clicks to select file
5. Frontend validates: file type, size
6. Shows upload progress bar
7. On success: Document appears in list
8. On error: Shows error message with retry

### 2. System Generates Lease from Rental Application

```mermaid
sequenceDiagram
    actor Owner
    participant UI as Frontend
    participant API as Backend API
    participant PDF as pdf-lib
    participant FS as File System
    participant DB as Database

    Owner->>UI: Navigate to Applications page
    UI->>API: GET /api/applications/owner/:ownerId
    API->>DB: SELECT * FROM rental_applications WHERE owner_id = ?
    API->>UI: Return applications list
    UI->>Owner: Display applications
    Owner->>UI: Click "Generate Lease" on approved app
    UI->>Owner: Show lease generation form<br/>(pre-filled with app data)
    Owner->>UI: Fill lease details<br/>(start date, end date, terms)
    UI->>UI: Validate dates & amounts
    UI->>API: POST /api/leases/generate
    API->>DB: SELECT property, tenant, application data
    API->>PDF: Generate PDF with data
    PDF->>API: Return PDF buffer
    API->>FS: Save PDF to filesystem
    API->>DB: INSERT INTO lease_documents
    API->>UI: Return lease document ID
    UI->>Owner: Show success + "View Lease" button
    Owner->>UI: Click "View Lease"
    UI->>API: GET /api/documents/:id
    API->>UI: Return PDF for viewing
    UI->>Owner: Display PDF in viewer
```

**Steps**:
1. Owner views approved applications
2. Clicks "Generate Lease" button
3. Form appears with pre-filled data:
   - Property: From application
   - Tenant: From application
   - Move-in date: From application
   - Monthly rent: From property
4. Owner fills additional fields:
   - Lease end date (or duration)
   - Payment day of month
   - Additional terms
5. Clicks "Generate Lease"
6. System creates PDF
7. Success message with "View Lease" link
8. Owner reviews generated lease

### 3. Tenant Views and Signs Lease

```mermaid
sequenceDiagram
    actor Tenant
    participant UI as Frontend
    participant API as Backend API
    participant DB as Database

    Tenant->>UI: Receive email notification
    Tenant->>UI: Click link → Navigate to Documents
    UI->>API: GET /api/documents/list
    API->>DB: SELECT documents WHERE tenant_id = ?
    API->>UI: Return documents list
    UI->>Tenant: Display "Pending Signature" lease
    Tenant->>UI: Click "View & Sign"
    UI->>API: GET /api/documents/:id
    API->>DB: SELECT document + property + owner data
    API->>UI: Return document metadata
    UI->>Tenant: Display PDF viewer + Sign button
    Tenant->>UI: Read lease document
    Tenant->>UI: Click "Sign Document"
    UI->>Tenant: Show signature modal
    Tenant->>UI: Choose: Draw or Type signature
    alt Draw Signature
        Tenant->>UI: Draw on canvas with mouse/touch
    else Type Signature
        Tenant->>UI: Type full name
    end
    Tenant->>UI: Click "I Agree" checkbox
    Tenant->>UI: Click "Submit Signature"
    UI->>API: POST /api/documents/:id/sign
    API->>API: Capture server timestamp & IP
    API->>DB: INSERT INTO document_signatures
    API->>DB: UPDATE lease_documents SET status = 'signed'
    API->>UI: Return success
    UI->>Tenant: Show "Successfully Signed" message
    UI->>Tenant: Update document list (now "Signed")
```

**Steps**:
1. Tenant receives email: "Your lease is ready"
2. Clicks link to Documents page
3. Sees lease with "Pending Signature" badge
4. Clicks "View & Sign"
5. PDF viewer opens with lease content
6. Tenant reads through document
7. Clicks "Sign Document" button
8. Signature modal appears with two options:
   - Draw: Canvas for signature drawing
   - Type: Text input for full name
9. Tenant chooses method and provides signature
10. Checks "I agree to the terms" checkbox
11. Clicks "Submit Signature"
12. Success message: "Lease signed successfully"
13. Document status changes to "Signed"

### 4. Owner Downloads Signed Lease

```mermaid
sequenceDiagram
    actor Owner
    participant UI as Frontend
    participant API as Backend API
    participant FS as File System
    participant DB as Database

    Owner->>UI: Navigate to Documents page
    UI->>API: GET /api/documents/list
    API->>DB: SELECT documents WHERE owner_id = ?
    API->>UI: Return documents (with signing status)
    UI->>Owner: Display list with "Signed" badge
    Owner->>UI: Click "Download" button
    UI->>API: GET /api/documents/:id/download
    API->>DB: Verify owner has access
    API->>FS: Read PDF file
    FS->>API: Return PDF binary
    API->>UI: Return PDF with Content-Disposition: attachment
    UI->>Owner: Browser downloads file
    Owner->>Owner: PDF saved to local computer
```

**Steps**:
1. Owner navigates to Documents page
2. Sees list of documents with signing status
3. Identifies signed lease (green "Signed" badge)
4. Clicks download icon
5. Browser initiates download
6. PDF file saved with name: `lease_{property}_{tenant}_{date}.pdf`

### 5. Sharing Lease with Third Parties

```mermaid
sequenceDiagram
    actor User as Owner/Tenant
    participant UI as Frontend
    participant API as Backend API
    participant DB as Database
    actor ThirdParty as Third Party

    User->>UI: Navigate to document details
    User->>UI: Click "Share" button
    UI->>API: GET /api/documents/:id/share
    API->>DB: Generate share token (UUID)
    API->>DB: INSERT INTO document_shares<br/>(token, document_id, expires_at)
    API->>UI: Return share URL
    UI->>User: Display shareable link
    User->>UI: Click "Copy Link"
    UI->>User: "Link copied to clipboard"
    User->>ThirdParty: Send link via email/message
    ThirdParty->>UI: Click link
    UI->>API: GET /shared/documents/:token
    API->>DB: SELECT document WHERE share_token = ?<br/>AND expires_at > NOW()
    API->>DB: Log access (audit trail)
    alt Token valid
        API->>UI: Return PDF for viewing
        UI->>ThirdParty: Display PDF viewer
    else Token expired
        API->>UI: Return 404 or expired message
        UI->>ThirdParty: Show "Link expired" message
    end
```

**Steps**:
1. User opens document details page
2. Clicks "Share" button
3. System generates secure link (expires in 7 days)
4. User copies link
5. Sends to third party (lawyer, bank, etc.)
6. Third party clicks link
7. PDF opens in browser (no login required)
8. Link expires after 7 days

---

## Error Handling

### Error Categories

| Category            | HTTP Code | User Message                                            | Log Level |
|---------------------|-----------|--------------------------------------------------------|-----------|
| Validation Error    | 400       | Specific field error (e.g., "File must be PDF")        | INFO      |
| Unauthorized        | 401       | "Please log in to continue"                             | WARN      |
| Forbidden           | 403       | "You don't have permission to access this document"     | WARN      |
| Not Found           | 404       | "Document not found"                                    | INFO      |
| Conflict            | 409       | "Document already signed"                               | INFO      |
| Server Error        | 500       | "Something went wrong. Please try again."               | ERROR     |

### Frontend Error Handling

**Component-Level Error Boundaries**:

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <h3 className="font-bold text-rose-900">Something went wrong</h3>
          <p className="text-sm text-rose-700">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-rose-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**API Error Handler**:

```typescript
// lib/api-client.ts
interface APIError {
  error: string;
  message: string;
  details?: any;
}

export class APIClient {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  static async post<T>(url: string, data: any): Promise<T> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  // Similar methods for GET, PUT, DELETE...
}
```

**User-Friendly Error Messages**:

```typescript
// lib/error-messages.ts
export const errorMessages: Record<string, string> = {
  // Upload errors
  'FILE_TOO_LARGE': 'File size exceeds 10 MB limit. Please upload a smaller file.',
  'INVALID_FILE_TYPE': 'Only PDF files are accepted. Please select a valid PDF document.',
  'UPLOAD_FAILED': 'Upload failed due to network error. Please check your connection and try again.',
  
  // Access errors
  'UNAUTHORIZED': 'Please log in to continue.',
  'FORBIDDEN': 'You do not have permission to access this document.',
  'NOT_FOUND': 'Document not found.',
  
  // Signature errors
  'ALREADY_SIGNED': 'You have already signed this document.',
  'SIGNATURE_FAILED': 'Signature failed. Please try signing again.',
  'MISSING_CONSENT': 'You must agree to the terms before signing.',
  
  // Generation errors
  'GENERATION_FAILED': 'Cannot generate lease: missing required property or tenant information.',
  'INVALID_DATES': 'Lease end date must be after start date.',
  
  // Generic
  'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
  'SERVER_ERROR': 'Something went wrong. Please try again or contact support.',
};

export function getUserMessage(errorCode: string): string {
  return errorMessages[errorCode] || errorMessages['SERVER_ERROR'];
}
```

### Backend Error Handling

**Centralized Error Handler Middleware**:

```typescript
// middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    user: (req as any).user?.id,
    error: err.message,
    stack: err.stack,
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'DATABASE_ERROR',
      message: 'Database operation failed',
    });
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.message.includes('File too large')) {
      return res.status(400).json({
        error: 'FILE_TOO_LARGE',
        message: 'File size exceeds 10 MB limit',
      });
    }
  }

  // Default server error
  return res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Internal server error',
  });
};

// Usage in index.ts
app.use(errorHandler);
```

**Controller Error Patterns**:

```typescript
// controllers/documents.controller.ts
import { AppError } from '../middleware/error-handler.middleware';

export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.leaseDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new AppError(404, 'NOT_FOUND', 'Document not found');
    }

    // Check access
    const hasAccess = 
      document.owner_id === userId ||
      document.tenant_id === userId ||
      req.user.role === 'SUPERADMIN';

    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this document');
    }

    return res.json(document);
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};
```

---

## Testing Strategy

### Unit Tests

**Frontend Component Tests** (using Vitest + React Testing Library):

```typescript
// components/__tests__/PDFUploadZone.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PDFUploadZone } from '../PDFUploadZone';

describe('PDFUploadZone', () => {
  it('renders upload zone with instructions', () => {
    render(<PDFUploadZone onUploadSuccess={vi.fn()} onUploadError={vi.fn()} />);
    expect(screen.getByText(/drag.*drop.*pdf/i)).toBeInTheDocument();
  });

  it('rejects non-PDF files', async () => {
    const onError = vi.fn();
    render(<PDFUploadZone onUploadSuccess={vi.fn()} onUploadError={onError} />);
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('PDF'));
    });
  });

  it('rejects files larger than 10MB', async () => {
    const onError = vi.fn();
    render(<PDFUploadZone onUploadSuccess={vi.fn()} onUploadError={onError} />);
    
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
      type: 'application/pdf' 
    });
    const input = screen.getByLabelText(/upload/i);
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('10 MB'));
    });
  });

  it('calls onUploadSuccess with document ID on successful upload', async () => {
    const onSuccess = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ document: { id: 'doc-123' } }),
    });
    
    render(<PDFUploadZone onUploadSuccess={onSuccess} onUploadError={vi.fn()} />);
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('doc-123');
    });
  });
});
```

**Backend Controller Tests** (using Bun's built-in test runner):

```typescript
// controllers/__tests__/documents.controller.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { uploadDocument } from '../documents.controller';
import prisma from '../../lib/prisma';

describe('Documents Controller', () => {
  beforeEach(() => {
    // Reset mocks
    mock.restore();
  });

  describe('uploadDocument', () => {
    it('returns 400 when file is missing', async () => {
      const req = {
        user: { id: 'user-123', role: 'OWNER' },
        file: undefined,
      };
      const res = {
        status: mock(() => res),
        json: mock(),
      };

      await uploadDocument(req as any, res as any, () => {});

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.any(String),
        message: expect.stringContaining('file'),
      });
    });

    it('creates database record on successful upload', async () => {
      const mockFile = {
        filename: 'uuid.pdf',
        originalname: 'lease.pdf',
        size: 1000,
        path: '/uploads/documents/2024/01/uuid.pdf',
      };

      const req = {
        user: { id: 'user-123', role: 'OWNER' },
        file: mockFile,
        body: { propertyId: 'prop-123', tenantId: 'tenant-123' },
      };

      const res = {
        status: mock(() => res),
        json: mock(),
      };

      const mockCreate = mock(() => Promise.resolve({ id: 'doc-123' }));
      prisma.leaseDocument.create = mockCreate;

      await uploadDocument(req as any, res as any, () => {});

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          original_filename: 'lease.pdf',
          file_size_bytes: 1000,
        }),
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
```

### Integration Tests

**API Endpoint Tests** (using supertest):

```typescript
// __tests__/integration/documents.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import app from '../../index';
import prisma from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

describe('Documents API Integration', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;

  beforeAll(async () => {
    // Create test user and property
    const user = await prisma.user.create({
      data: {
        full_name: 'Test Owner',
        email: 'owner@test.com',
        password_hash: 'hashed',
        role: 'OWNER',
      },
    });
    userId = user.id;

    const property = await prisma.property.create({
      data: {
        title: 'Test Property',
        category: 'HOUSE',
        rent_amount: 10000,
        address: 'Test Address',
        city: 'Addis Ababa',
        owner_id: userId,
        validation: 'APPROVED',
      },
    });
    propertyId = property.id;

    // Generate JWT token
    authToken = generateToken(user);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.leaseDocument.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/documents/upload', () => {
    it('successfully uploads a PDF file', async () => {
      const pdfPath = path.join(__dirname, 'fixtures', 'test.pdf');
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfPath)
        .field('propertyId', propertyId)
        .field('documentType', 'lease_agreement');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.document.id).toBeDefined();

      // Verify file exists in filesystem
      const doc = await prisma.leaseDocument.findUnique({
        where: { id: response.body.document.id },
      });
      expect(fs.existsSync(doc!.file_path)).toBe(true);
    });

    it('rejects non-PDF files', async () => {
      const txtPath = path.join(__dirname, 'fixtures', 'test.txt');
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', txtPath);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PDF');
    });

    it('requires authentication', async () => {
      const pdfPath = path.join(__dirname, 'fixtures', 'test.pdf');
      
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('file', pdfPath);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/documents/:id', () => {
    let documentId: string;

    beforeAll(async () => {
      // Create test document
      const doc = await prisma.leaseDocument.create({
        data: {
          property_id: propertyId,
          tenant_id: userId,
          owner_id: userId,
          document_type: 'lease_agreement',
          original_filename: 'test.pdf',
          file_path: '/path/to/file.pdf',
          file_size_bytes: 1000,
          uploaded_by_user_id: userId,
        },
      });
      documentId = doc.id;
    });

    it('returns document metadata for authorized user', async () => {
      const response = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(documentId);
      expect(response.body.originalFilename).toBe('test.pdf');
    });

    it('returns 404 for non-existent document', async () => {
      const response = await request(app)
        .get(`/api/documents/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
```

### End-to-End Tests

**Full Workflow Test** (using Playwright):

```typescript
// e2e/lease-signing-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Lease Signing Workflow', () => {
  test('owner generates lease and tenant signs it', async ({ page, context }) => {
    // 1. Login as owner
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/owner/dashboard');

    // 2. Navigate to applications
    await page.click('text=Applications');
    await expect(page).toHaveURL('/owner/applications');

    // 3. Find approved application
    await page.click('[data-testid="app-card"]:has-text("Approved")');

    // 4. Generate lease
    await page.click('button:has-text("Generate Lease")');
    await page.fill('input[name="startDate"]', '2024-02-01');
    await page.fill('input[name="endDate"]', '2025-02-01');
    await page.fill('input[name="paymentDay"]', '1');
    await page.click('button:has-text("Generate")');

    // 5. Wait for generation
    await expect(page.locator('text=Lease generated successfully')).toBeVisible();
    await page.click('button:has-text("View Lease")');

    // 6. Verify PDF viewer opens
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();

    // 7. Logout owner
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // 8. Login as tenant
    await page.goto('/login');
    await page.fill('input[name="email"]', 'tenant@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 9. Navigate to documents
    await page.click('text=My Documents');
    await expect(page).toHaveURL('/tenant/documents');

    // 10. Find pending lease
    await page.click('[data-testid="doc-card"]:has-text("Pending Signature")');

    // 11. Sign document
    await page.click('button:has-text("Sign Document")');
    await page.click('text=Draw Signature');
    
    // Draw signature on canvas
    const canvas = await page.locator('canvas[data-testid="signature-canvas"]');
    const box = await canvas.boundingBox();
    await page.mouse.move(box!.x + 50, box!.y + 50);
    await page.mouse.down();
    await page.mouse.move(box!.x + 150, box!.y + 50);
    await page.mouse.up();

    await page.check('input[type="checkbox"]:has-text("I agree")');
    await page.click('button:has-text("Submit Signature")');

    // 12. Verify success
    await expect(page.locator('text=Successfully signed')).toBeVisible();
    await expect(page.locator('[data-testid="doc-card"]')).toContainText('Signed');
  });
});
```

### Performance Testing

**Load Test** (using k6):

```javascript
// load-tests/document-upload.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.1'],     // Less than 10% errors
  },
};

export default function () {
  const token = 'your-jwt-token';
  const pdfData = open('./fixtures/test-5mb.pdf', 'b');

  const payload = {
    file: http.file(pdfData, 'test.pdf', 'application/pdf'),
    propertyId: 'test-property-id',
  };

  const response = http.post(
    'http://localhost:3000/api/documents/upload',
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  check(response, {
    'status is 201': (r) => r.status === 201,
    'upload time < 10s': (r) => r.timings.duration < 10000,
  });

  sleep(1);
}
```

**Run Load Test**:
```bash
k6 run load-tests/document-upload.js
```

---

## Performance Considerations

### File Upload Optimization

**Chunked Upload** (for files > 5MB):

```typescript
// Future enhancement: chunked upload for large files
interface ChunkUploadConfig {
  chunkSize: number; // e.g., 1MB
  maxRetries: number;
  onProgress: (percent: number) => void;
}

async function uploadFileInChunks(
  file: File,
  config: ChunkUploadConfig
): Promise<string> {
  const totalChunks = Math.ceil(file.size / config.chunkSize);
  const uploadId = crypto.randomUUID();

  for (let i = 0; i < totalChunks; i++) {
    const start = i * config.chunkSize;
    const end = Math.min(start + config.chunkSize, file.size);
    const chunk = file.slice(start, end);

    let retries = 0;
    while (retries < config.maxRetries) {
      try {
        await uploadChunk(uploadId, i, chunk);
        config.onProgress((i + 1) / totalChunks * 100);
        break;
      } catch (error) {
        retries++;
        if (retries >= config.maxRetries) throw error;
        await sleep(1000 * retries); // Exponential backoff
      }
    }
  }

  // Finalize upload
  const documentId = await finalizeUpload(uploadId);
  return documentId;
}
```

### Database Query Optimization

**Indexed Queries**:

```sql
-- Already have indexes from schema
CREATE INDEX idx_lease_docs_property ON lease_documents(property_id);
CREATE INDEX idx_lease_docs_tenant ON lease_documents(tenant_id);
CREATE INDEX idx_lease_docs_owner ON lease_documents(owner_id);
CREATE INDEX idx_lease_docs_uploaded_at ON lease_documents(uploaded_at DESC);
```

**Efficient Pagination**:

```typescript
// Use cursor-based pagination for large datasets
async function getDocumentsPaginated(
  userId: string,
  cursor?: string,
  limit: number = 50
) {
  const documents = await prisma.leaseDocument.findMany({
    where: {
      OR: [
        { owner_id: userId },
        { tenant_id: userId },
      ],
    },
    take: limit + 1, // Fetch one extra to check if there are more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { uploaded_at: 'desc' },
    select: {
      id: true,
      property: { select: { title: true } },
      tenant: { select: { full_name: true } },
      document_type: true,
      uploaded_at: true,
      signatures: {
        select: { status: true, signed_at: true },
      },
    },
  });

  const hasMore = documents.length > limit;
  const items = hasMore ? documents.slice(0, -1) : documents;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
}
```

### PDF Rendering Optimization

**Lazy Loading Pages**:

```typescript
// Only render visible pages + 1 page buffer
const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));

const handleScroll = useCallback((event: Event) => {
  const container = event.target as HTMLElement;
  const scrollTop = container.scrollTop;
  const pageHeight = 792; // Standard letter page height
  
  const currentPage = Math.floor(scrollTop / pageHeight) + 1;
  const pagesToRender = new Set([
    Math.max(1, currentPage - 1),
    currentPage,
    Math.min(totalPages, currentPage + 1),
  ]);
  
  setVisiblePages(pagesToRender);
}, [totalPages]);

// Render only visible pages
{Array.from(visiblePages).map(pageNum => (
  <PDFPage key={pageNum} pageNumber={pageNum} />
))}
```

**Web Worker for PDF Parsing**:

```typescript
// workers/pdf.worker.ts
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

self.addEventListener('message', async (event) => {
  const { type, url, pageNum } = event.data;

  if (type === 'render-page') {
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({ canvasContext: context, viewport }).promise;
    const bitmap = await canvas.transferToImageBitmap();

    self.postMessage({ type: 'page-rendered', pageNum, bitmap }, [bitmap]);
  }
});
```

### Caching Strategy

**Browser Cache**:
- PDF files: Cache-Control: `public, max-age=86400` (24 hours)
- Document metadata: Cache-Control: `private, max-age=300` (5 minutes)

**Server-Side Cache** (using Redis - future enhancement):

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getDocumentWithCache(documentId: string) {
  // Try cache first
  const cached = await redis.get(`document:${documentId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const document = await prisma.leaseDocument.findUnique({
    where: { id: documentId },
    include: { property: true, tenant: true, owner: true },
  });

  // Cache for 5 minutes
  await redis.setex(`document:${documentId}`, 300, JSON.stringify(document));

  return document;
}
```

---

## Deployment Considerations

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/renthub
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000

# File storage
UPLOAD_DIR=/var/www/renthub/uploads
MAX_FILE_SIZE_MB=10

# Optional: External storage
AWS_S3_BUCKET=renthub-documents
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Optional: Redis cache
REDIS_URL=redis://localhost:6379
```

### File System Setup

```bash
# Create upload directory
sudo mkdir -p /var/www/renthub/uploads/documents
sudo chown -R node:node /var/www/renthub/uploads
sudo chmod -R 755 /var/www/renthub/uploads

# Set up log rotation for uploads directory
sudo nano /etc/logrotate.d/renthub-uploads
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/renthub

server {
    listen 80;
    server_name renthub.com www.renthub.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name renthub.com www.renthub.com;

    ssl_certificate /etc/letsencrypt/live/renthub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/renthub.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/renthub/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Document uploads - increase client_max_body_size
    location /api/documents/upload {
        client_max_body_size 10M;
        proxy_pass http://localhost:3000;
    }
}
```

### PM2 Process Management

```json
// ecosystem.config.json
{
  "apps": [
    {
      "name": "renthub-backend",
      "script": "bun",
      "args": "index.ts",
      "cwd": "/var/www/renthub/backend",
      "instances": 2,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "error_file": "/var/log/renthub/backend-error.log",
      "out_file": "/var/log/renthub/backend-out.log",
      "merge_logs": true,
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
}
```

**Start/Stop Commands**:
```bash
pm2 start ecosystem.config.json
pm2 stop renthub-backend
pm2 restart renthub-backend
pm2 logs renthub-backend
```

### Database Migration

```bash
# Run migrations
cd backend
bunx prisma migrate deploy

# Seed initial data (if needed)
bunx prisma db seed
```

### Monitoring & Health Checks

**Health Check Endpoint**:

```typescript
// Add to routes/index.ts
router.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check file system
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    await fs.promises.access(uploadDir, fs.constants.W_OK);
    
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      filesystem: 'writable',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

**Monitoring Script**:

```bash
#!/bin/bash
# /usr/local/bin/renthub-monitor.sh

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" https://renthub.com/api/health)

if [ $response != "200" ]; then
  echo "$(date): API health check failed (HTTP $response)"
  # Send alert (email, Slack, etc.)
  pm2 restart renthub-backend
fi

# Check disk space
usage=$(df -h /var/www/renthub/uploads | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $usage -gt 80 ]; then
  echo "$(date): Disk usage high ($usage%)"
  # Send alert
fi
```

**Cron Job**:
```cron
# Run health check every 5 minutes
*/5 * * * * /usr/local/bin/renthub-monitor.sh >> /var/log/renthub/monitor.log 2>&1
```

---

## Summary

This design provides a complete, production-ready Lease Document Management System that:

✅ **Integrates seamlessly** with existing RentHub architecture  
✅ **Follows security best practices** (server-side timestamps, IP capture, audit logs)  
✅ **Provides excellent UX** (drag-drop uploads, in-browser viewing, digital signatures)  
✅ **Scales efficiently** (pagination, indexing, optional caching)  
✅ **Maintains code quality** (TypeScript, Prisma ORM, Zod validation)  
✅ **Includes comprehensive testing** (unit, integration, E2E)  
✅ **Supports deployment** (PM2, Nginx, monitoring)  

**Next Steps**:
1. Review and approve design document
2. Create database migration scripts
3. Implement backend API controllers
4. Build frontend components
5. Add signature_pad and pdfjs-dist dependencies
6. Write tests
7. Deploy to staging environment
8. Conduct user acceptance testing
9. Deploy to production

