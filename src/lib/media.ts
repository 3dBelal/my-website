// Resolves media paths used in the YAML data files.
//
// A path like "3d/product/lamp-animation/1.jpg" is an image in src/media/.
// A path ending in .mp4 is a video in public/media/. For a video "x.mp4" we
// also look for "x-loop.mp4" (short silent loop, public/media/) and
// "x-poster.jpg" (still frame, src/media/). Videos without a loop file use
// the full file as their loop.
import fs from 'node:fs';
import path from 'node:path';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('/src/media/**/*.{jpg,jpeg,png,webp}', {
	eager: true,
});

export interface MediaRef {
	file: string;
	caption?: string;
	alt?: string;
}

export interface Media {
	file: string;
	type: 'image' | 'video';
	image: ImageMetadata; // the image itself, or the video's poster
	video?: string; // full video URL
	loop?: string; // short loop URL for grids and the hero
	width: number;
	height: number;
	caption?: string;
	alt: string;
}

function findImage(file: string): ImageMetadata {
	const mod = images[`/src/media/${file}`];
	if (!mod) throw new Error(`Media not found: src/media/${file} (check the path in the YAML file)`);
	return mod.default;
}

function publicExists(file: string) {
	return fs.existsSync(path.join(process.cwd(), 'public', 'media', file));
}

export function media(ref: MediaRef | string, fallbackAlt = ''): Media {
	const r = typeof ref === 'string' ? { file: ref } : ref;
	const alt = r.alt ?? r.caption ?? fallbackAlt;
	if (r.file.endsWith('.mp4')) {
		if (!publicExists(r.file)) throw new Error(`Video not found: public/media/${r.file}`);
		const base = r.file.slice(0, -4);
		const poster = findImage(`${base}-poster.jpg`);
		const loopFile = publicExists(`${base}-loop.mp4`) ? `${base}-loop.mp4` : r.file;
		return {
			file: r.file,
			type: 'video',
			image: poster,
			video: `/media/${r.file}`,
			loop: `/media/${loopFile}`,
			width: poster.width,
			height: poster.height,
			caption: r.caption,
			alt,
		};
	}
	const image = findImage(r.file);
	return { file: r.file, type: 'image', image, width: image.width, height: image.height, caption: r.caption, alt };
}

// Widths for responsive images, never larger than the source.
export function widthsFor(img: ImageMetadata, wanted = [400, 800, 1200, 1600]) {
	const w = wanted.filter((x) => x < img.width);
	return [...w, Math.min(img.width, wanted[wanted.length - 1])];
}

// Optimized poster URL for <video poster>.
export async function posterUrl(img: ImageMetadata, width = 900) {
	const out = await getImage({ src: img, width: Math.min(width, img.width), format: 'webp' });
	return out.src;
}

export interface LightboxItem {
	type: 'image' | 'video';
	src: string;
	srcset?: string;
	poster?: string;
	w: number;
	h: number;
	caption?: string;
	alt: string;
}

// Data the lightbox needs for one item: a large image, or the full video.
export async function lightboxItem(m: Media): Promise<LightboxItem> {
	if (m.type === 'video') {
		return {
			type: 'video',
			src: m.video!,
			poster: await posterUrl(m.image, 1600),
			w: m.width,
			h: m.height,
			caption: m.caption,
			alt: m.alt,
		};
	}
	const widths = widthsFor(m.image, [1200, 2000]);
	const out = await getImage({ src: m.image, widths, format: 'webp' });
	return {
		type: 'image',
		src: out.src,
		srcset: out.srcSet.attribute,
		w: m.width,
		h: m.height,
		caption: m.caption,
		alt: m.alt,
	};
}
