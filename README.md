# Gatrion Docs

Documentation hub untuk seluruh project Gatrion, dibangun dengan **Astro + Tailwind CSS**.

## 🚀 Fitur

- **Statis & Ringan** - Output HTML murni, tanpa database atau backend
- **MDX Support** - Tulis konten Markdown dengan komponen React/Vue/Custom
- **Command Palette (⌘K)** - Navigasi cepat ke halaman mana pun
- **Dark/Light Mode** - Tema otomatis tersimpan di localStorage
- **Multi-project** - Sidebar switcher untuk pindah antar project
- **Responsive** - Mobile-friendly dengan drawer navigation
- **Modern Design** - Glassmorphism, glow effects, smooth animations

## 🛠️ Tech Stack

- **Framework**: [Astro 7](https://astro.build/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Content**: MDX dengan Content Collections
- **Font**: Plus Jakarta Sans + JetBrains Mono

## 📂 Struktur Project

```
src/
├── components/           # Komponen reusable
│   ├── Callout.astro     # Alert boxes (info/warning/success)
│   ├── CommandPalette.astro # ⌘K search modal
│   ├── Sidebar.astro     # Project switcher & navigation
│   └── MarkdownContent.astro # Render MDX body
├── content/              # Konten markdown/mdx
│   ├── changelog.mdx     # Release notes global
│   └── docs/             # Per-project documentation
│       └── core-api/
│           └── getting-started.mdx
├── layouts/              # Layout template
│   ├── DocsLayout.astro  # Layout untuk halaman docs
│   └── HubLayout.astro   # Layout untuk hub & pages lain
├── pages/                # Halaman routes
│   ├── index.astro       # Hub landing page
│   ├── 404/index.astro   # Not found page
│   ├── changelog/        # Changelog route
│   └── docs/             # Dynamic docs route
└── styles/
    └── globals.css       # Tailwind config & custom styles
```

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Development mode

```bash
npm run dev
```

Akses di `http://localhost:4321`

### Build untuk production

```bash
npm run build
```

Output di folder `dist/`

### Preview production build

```bash
npm run preview
```

## ✍️ Menambah Dokumen Baru

1. Buat file MDX baru di `src/content/docs/<project>/<judul>.mdx`:

```markdown
---
title: "Panduan Deployment"
project: "Core API"
description: "Cara deploy Core API ke produksi"
---

# Panduan Deployment

Konten dokumentasi kamu di sini...
```

2. Tambahkan link di sidebar jika perlu.

3. Update command palette `PAGES` array di komponen `CommandPalette.astro`.

## 🎨 Kustomisasi Desain

Edit file berikut:

- **Warna tema**: `src/styles/globals.css`
- **Layout components**: `src/components/`
- **Typography**: `tailwind.config.mjs` (via Astro integration)

## 📝 Migrasi dari Mockup HTML

File mockup HTML disimpan di folder `mockup/`. Untuk migrasi halaman tertentu ke format Astro:

1. Copy konten HTML → buat file `.mdx` baru
2. Wrap dengan layout component (`DocsLayout.astro`)
3. Pindahkan style inline ke tailwind classes
4. Hapus file HTML lama

## 🔧 Tips & Tricks

- Gunakan **Callout component** untuk tip/warning:

```jsx
<Callout type="info">
  Ini adalah tips!
</Callout>
```

- Command palette bisa difilter per project dengan menambah data `project` di array `PAGES`
- Semua animasi menggunakan CSS keyframes dari `globals.css`

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'feat: add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📄 License

Internal use only — © 2025 Gatrion
