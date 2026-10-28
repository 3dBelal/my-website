# 3dbelal.xyz

Portfolio and CV of Belal A. N. Abdelkarim — mechanical engineer and 3D artist.

- Built with [Astro](https://astro.build); deployed to GitHub Pages by
  `.github/workflows/deploy.yml` on every push to `main`.
- Content: `src/data/*.yaml`. Images: `src/media/` (optimized at build time).
  Videos and the CV PDF: `public/`.
- To change content, see [HOW-TO-UPDATE.md](HOW-TO-UPDATE.md).

```
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
```

## Credits

Started from [astro-photography-portfolio](https://github.com/rockem/astro-photography-portfolio)
by Eli Segal (rockem), released under the MIT License. The site has since been
largely rewritten; the YAML-driven gallery idea comes from that template.
