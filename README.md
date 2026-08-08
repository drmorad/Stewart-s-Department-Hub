# Steward's Cleaning Schedule Generator 🧼✨

A professional-grade, AI-powered hygiene and sanitation management platform designed specifically for hospitality Steward Departments. This application streamlines the creation, management, and tracking of kitchen cleaning protocols using the latest Google Gemini AI technology.

## 🚀 Key Features

### 🤖 AI-Powered Schedule Generation
- **Intelligent Planning**: Generates comprehensive cleaning schedules covering 'Preparation Tools', 'Cooking Equipment', 'Warewashing', and 'Live Buffet' categories.
- **Deep Detail**: Produces specific tasks for Daily, Weekly, and Monthly frequencies, including surface-specific instructions (e.g., stainless steel vs. cast iron).
- **Contextual Notes**: Automatically generates safety warnings and special handling instructions (e.g., "Ensure unit is cool before cleaning").

### 🧪 Advanced Chemical Management
- **SDS Extraction**: Uses Gemini AI to analyze uploaded Safety Data Sheets (PDFs) and automatically extract product names, active ingredients, usage instructions, and safety profiles.
- **Smart Matching**: A custom TF-IDF and synonym-based matching engine suggests the best available chemical for any specific cleaning task.
- **PPE Tracking**: Visual indicators and checklists for required Personal Protective Equipment based on chemical toxicity.
- **Safety Ratings**: Automatically calculates chemical risk levels (High, Medium, Low) based on toxicological data.

### 📋 Interactive Checklist & Dependencies
- **Real-time Tracking**: Interactive checklist view to mark tasks as complete with progress visualization.
- **Task Dependencies**: Link tasks together (e.g., "Must isolate power" before "Deep clean interior") to prevent unsafe workflows.
- **Persistence**: Local storage ensures your progress isn't lost during a session.

### ☁️ Cloud Sync & Security
- **Google Drive Integration**: Seamlessly back up your entire database (schedules, chemicals, and checklist progress) to your personal Google Drive.
- **Cross-Device Restore**: Restore your configuration on any device by signing into your Google account.

### 📄 Professional Reporting
- **PDF Export**: Generate high-quality, print-ready PDFs for:
  - Comprehensive Cleaning Schedules (Portrait/Landscape).
  - Current Checklist Status.
  - Chemical Master Lists (including safety summaries).
- **Custom Branding**: Upload your hotel/company logo and set custom department headers for all reports.

### 🌍 Accessibility & UI/UX
- **Bilingual Support**: Full English and Arabic support with localized Right-to-Left (RTL) layout.
- **Dark Mode**: High-contrast dark theme for low-light kitchen environments.
- **Responsive Design**: Optimized for tablets and desktops.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Engine**: Google Gemini API (`@google/genai`)
- **PDF Engine**: jsPDF & AutoTable
- **Cloud Storage**: Google Drive API v3 & Google Identity Services
- **Icons**: FontAwesome 6

## 🚦 Getting Started

1. **Generate a Schedule**: Click the "Create Cleaning Plan" button to let the AI build your initial protocol.
2. **Add Chemicals**: Navigate to "Manage Chemicals". You can manually add them, bulk import via text, or upload a PDF SDS for AI-assisted data entry.
3. **Map Chemicals**: Use the flask icon on any task to associate it with a specific chemical from your inventory.
4. **Track Progress**: Switch to "Checklist View" during shifts to mark tasks as done.
5. **Sync**: Click "Cloud Sync" to authorize Google Drive and secure your data.
6. **Export**: Use the "Export as PDF" button to print your physical logs.

---

*Developed by Senior Frontend Engineering for the Steward Department. Powered by Google Gemini.*