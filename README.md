# 📄 CV Builder

**CV Builder** is an intuitive web tool for creating professional resumes in real time.  
No registration, no ads — just your data and a clean, ATS-compliant result.

<a href="https://github.com/drofji/cv-builder/stargazers"><img src="https://img.shields.io/github/stars/drofji/cv-builder" alt="Stars Badge"/></a>
<a href="https://github.com/drofji/cv-builder/network/members"><img src="https://img.shields.io/github/forks/drofji/cv-builder" alt="Forks Badge"/></a>
<a href="https://github.com/drofji/cv-builder/pulls"><img src="https://img.shields.io/github/issues-pr/drofji/cv-builder" alt="Pull Requests Badge"/></a>
<a href="https://github.com/drofji/cv-builder/issues"><img src="https://img.shields.io/github/issues/drofji/cv-builder" alt="Issues Badge"/></a>
<a href="https://github.com/drofji/cv-builder/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/drofji/cv-builder?color=2b9348"></a>
<a href="https://github.com/drofji/cv-builder/blob/master/LICENSE"><img src="https://img.shields.io/github/license/drofji/cv-builder?color=2b9348" alt="License Badge"/></a>

---

## 🌐 Live Demo

The project is fully functional and available here:  
👉 **[Open CV Builder on GitHub Pages](https://drofji.github.io/cv-builder/)**

You can also try the ATS-safe demo import directly via URL:  
👉 **[ATS Demo Resume](https://drofji.github.io/cv-builder/?import_from_url=https://drofji.github.io/cv-builder/examples/import-demo-ats-safe.json)**

---

## ✨ Key Features

⚡ **Live Preview**  
See changes instantly as you type.

🌍 **Bilingual Interface**  
Supports English and German (Deutsch) for creating international resumes.

💾 **Local Storage**  
Your data is saved directly in your browser using IndexedDB.  
You can close the page and continue editing later.

📂 **Import / Export**  
Save your data as a `.json` file or import from URL parameters for seamless configuration transfer.

🖨️ **PDF Export**  
Generate a clean, print-ready PDF with automatic page numbering and ATS-compliant layout.  
Single-column format, standard fonts, bullet points, and no decorative symbols.

📸 **Profile Photo**  
Photo disabled by default for ATS compliance. Enable with warning if needed.  
Controls activate only when an image is uploaded.

📱 **Responsive Editor**  
Easily manage Professional Experience, Education, Skills, Core Competencies, Projects, and Certifications.

---

## 🛠️ Tech Stack

- **HTML5 / CSS3** (Flexbox and Grid layout)
- **Bootstrap 5** (UI components and responsive grid)
- **Vanilla JavaScript** (rendering logic, ATS validation, state management)
- **IndexedDB** (browser-based local database)
- **html2pdf.js** (HTML-to-PDF conversion library)

---

## 🚀 Run Locally

1. Clone the repository:

```bash
git clone https://github.com/drofji/cv-builder.git
