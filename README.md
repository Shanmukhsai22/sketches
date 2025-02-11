# Collaborative Notebook Application

A web-based notebook application that allows users to create, manage, and share notebooks with both text and drawing capabilities.

## Features

### Authentication
- User registration and login
- Token-based authentication
- Session management

### Notebook Management
- Create and delete notebooks
- View all notebooks or filter by ownership
- Search notebooks by title or creator
- Real-time autosave functionality

### Text Editor
- Rich text editing
- Autosave capability
- Clean and intuitive interface

### Drawing Canvas
- Freehand drawing tools
- Eraser functionality
- Undo capability
- Clear canvas option
- Touch screen support
- Autosave for drawings

### Additional Features
- PDF export (includes both text and drawings)
- Owner badges for created notebooks
- Creation and last updated timestamps
- Search and filter functionality
- Responsive design for all devices

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd notebook-app
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Run the development server:
```bash
npm run dev
```

## Tech Stack
- **Frontend**: Next.js, TypeScript, CSS Modules
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT
- **PDF Export**: jsPDF
- **State Management**: React Hooks

## Design Decisions

### Split View Layout
- Separate sections for text and drawing for better organization
- Side-by-side view for larger screens, stacked for mobile

### Real-time Autosave
- Automatic saving after each change
- Local storage backup for unsaved changes

### Canvas Implementation
- Custom canvas implementation for better control
- Support for both mouse and touch events
- Separate stroke history for undo functionality

### Authentication
- Token-based auth for scalability
- User-specific notebook ownership

## Future Improvements

### MyScript API Integration
- Implement handwriting recognition using MyScript API
- Convert handwritten notes to digital text
- Smart stroke detection and correction
- Enhanced drawing experience with stroke prediction

## Running the Application
1. Access the application at `http://localhost:3000`
2. Register a new account or login
3. Create your first notebook using the "+ New Notebook" button
4. Start writing and drawing!