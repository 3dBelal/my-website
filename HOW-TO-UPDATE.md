# How to update the site

You never need to touch code. All content lives in four text files in
`src/data/`, and all pictures and videos live in two folders.

| What | Where |
| --- | --- |
| Name, email, social links, hero videos, "About", which projects show on the home page | `src/data/site.yaml` |
| 3D projects (titles, captions, which files) | `src/data/work-3d.yaml` |
| Engineering case studies | `src/data/engineering.yaml` |
| The web CV at /cv | `src/data/cv.yaml` |
| Images (`.jpg`) and video posters | `src/media/...` |
| Videos (`.mp4`) | `public/media/...` |
| The downloadable CV | `public/Belal_Abdelkarim_CV.pdf` |

Every push to the `main` branch rebuilds and publishes 3dbelal.xyz in about
two minutes. You can watch it under the **Actions** tab on GitHub. A red X
there means something is wrong; the site keeps showing the last good version.

## Editing on GitHub without installing anything

1. Open the file on github.com (e.g. `src/data/work-3d.yaml`).
2. Click the pencil icon, make the change, click **Commit changes**.
3. To upload media: open the folder (e.g. `src/media/3d/product/`), click
   **Add file → Upload files**, drag the files in, commit.

## Add a new 3D project

1. **Prepare the files** (same as before):
   - Images: JPG, longest side at most 2400 px. The site makes WebP/AVIF copies itself.
   - Each video needs three files with the same base name:
     - `name.mp4` – the full video (H.264, ≤1920 px)
     - `name-loop.mp4` – first ~6 seconds, no sound (used for hover previews)
     - `name-poster.jpg` – a still frame
2. **Put them in place**, e.g. for a project called `kettle`:
   - images and `name-poster.jpg` → `src/media/3d/product/kettle/`
   - `name.mp4` and `name-loop.mp4` → `public/media/3d/product/kettle/`
3. **Add one entry** to `src/data/work-3d.yaml`, under the right category:

   ```yaml
     - id: kettle                       # short, unique, no spaces
       title: Kettle — product renders  # no client or brand names
       category: product                # product, characters, art or motion
       caption: Studio renders of an electric kettle.
       media:
         - 3d/product/kettle/hero.mp4    # first file = the card cover
         - 3d/product/kettle/side.jpg
   ```

   Optional lines: `alsoIn: [motion]` (also show under another tab) and
   `fanArt: true` (for characters owned by someone else — also write "Fan art" in the caption).

The order in the file is the order on the page, so put the best work first.

## Add an engineering case study

Copy one of the existing blocks in `src/data/engineering.yaml` and change the
text. Put its images in `src/media/engineering/<id>/` and videos in
`public/media/engineering/<id>/`. Its page appears at `/engineering/<id>`.
Each figure can have its own caption:

```yaml
        media:
          - file: engineering/drone/frame-v1.jpg
            caption: "v1: first printed frame."
```

(Put a caption in quotes if it contains a colon `:`.)

## Change the home page

In `src/data/site.yaml`:
- `hero:` — the videos in the moving wall (5 on desktop, first 4 on phones).
- `featured:` — project ids shown under "Selected work", in order.
- `about:` — the short About text.

## Replace the CV

Upload the new PDF over `public/Belal_Abdelkarim_CV.pdf` (keep the same
name), then update `src/data/cv.yaml` so the web version matches.

## Rules for YAML files

- Indentation is spaces, not tabs, and it matters. Copy an existing entry and edit it.
- A line starting with `#` is a note and is ignored.
- If a build fails after an edit, the Actions log usually names the file and
  line, e.g. "Media not found: src/media/…" means a path is misspelled.

## Previewing on your own computer (optional)

Install Node.js 24, then in this folder run `npm install` once and
`npm run dev`, and open http://localhost:4321.
