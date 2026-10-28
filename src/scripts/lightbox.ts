// Full-screen media viewer. The clicked tile grows into the viewer (FLIP
// animation) and shrinks back on close. Keyboard: ← → Esc. Touch: swipe
// left/right to move, swipe down to close.
interface Item {
	type: 'image' | 'video';
	src: string;
	srcset?: string;
	poster?: string;
	w: number;
	h: number;
	caption?: string;
	alt: string;
}

const DURATION = 380;
const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

export function initLightbox() {
	const dataEl = document.getElementById('lb-data');
	const dialog = document.querySelector<HTMLDialogElement>('dialog.lb');
	if (!dataEl || !dialog) return;

	const groups: Record<string, Item[]> = JSON.parse(dataEl.textContent || '{}');
	const stage = dialog.querySelector<HTMLElement>('.lb-stage')!;
	const frame = dialog.querySelector<HTMLElement>('.lb-frame')!;
	const cap = dialog.querySelector<HTMLElement>('.lb-cap')!;
	const count = dialog.querySelector<HTMLElement>('.lb-count')!;
	const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let items: Item[] = [];
	let group = '';
	let index = 0;
	let opener: HTMLElement | null = null;
	let busy = false;

	// Where the media sits on screen at a given viewport size.
	function targetRect(it: Item) {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const side = vw >= 768 ? 72 : 12;
		const top = vw >= 768 ? 64 : 60;
		const bottom = 72;
		const aw = vw - side * 2;
		const ah = vh - top - bottom;
		const scale = Math.min(aw / it.w, ah / it.h, 2);
		const w = Math.round(it.w * scale);
		const h = Math.round(it.h * scale);
		return { left: Math.round((vw - w) / 2), top: Math.round(top + (ah - h) / 2), width: w, height: h };
	}

	function place(it: Item) {
		const r = targetRect(it);
		Object.assign(frame.style, {
			left: `${r.left}px`,
			top: `${r.top}px`,
			width: `${r.width}px`,
			height: `${r.height}px`,
		});
		return r;
	}

	function render(i: number, placeholder?: string) {
		index = (i + items.length) % items.length;
		const it = items[index];
		frame.querySelector('video')?.pause();
		frame.replaceChildren();
		frame.style.backgroundImage = placeholder ? `url("${placeholder}")` : '';
		const r = place(it);
		if (it.type === 'video') {
			const v = document.createElement('video');
			v.src = it.src;
			if (it.poster) v.poster = it.poster;
			v.controls = true;
			v.playsInline = true;
			v.autoplay = !reduced();
			v.preload = 'auto';
			v.setAttribute('aria-label', it.alt || it.caption || 'Video');
			frame.append(v);
		} else {
			const img = document.createElement('img');
			img.alt = it.alt;
			img.decoding = 'async';
			if (it.srcset) {
				img.srcset = it.srcset;
				img.sizes = `${r.width}px`;
			}
			img.src = it.src;
			img.addEventListener('load', () => (frame.style.backgroundImage = ''), { once: true });
			frame.append(img);
		}
		cap.textContent = it.caption ?? '';
		count.textContent = `${index + 1} / ${items.length}`;
		preload(index + 1);
		preload(index - 1);
	}

	function preload(i: number) {
		const it = items[(i + items.length) % items.length];
		if (!it || it.type !== 'image') return;
		const img = new Image();
		if (it.srcset) {
			img.sizes = `${targetRect(it).width}px`;
			img.srcset = it.srcset;
		}
		img.src = it.src;
	}

	function originFor(i: number) {
		const el = document.querySelector<HTMLElement>(`[data-lb-group="${group}"][data-lb-index="${i}"]`);
		const media = el?.querySelector<HTMLElement>('.media') ?? el;
		if (!media) return null;
		const r = media.getBoundingClientRect();
		const visible = r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
		return visible ? media : null;
	}

	function flipFrom(r: DOMRect, to: { left: number; top: number; width: number; height: number }) {
		const s = r.width / to.width;
		return `translate(${r.left - to.left}px, ${r.top - to.top}px) scale(${s}, ${r.height / to.height})`;
	}

	function open(g: string, i: number, trigger: HTMLElement) {
		if (busy || !groups[g]) return;
		group = g;
		items = groups[g];
		opener = trigger;
		const originMedia = trigger.querySelector<HTMLElement>('.media') ?? trigger;
		const thumb = originMedia.querySelector('img')?.currentSrc;
		dialog!.classList.toggle('single', items.length < 2);
		dialog!.showModal();
		render(i, thumb);
		requestAnimationFrame(() => dialog!.classList.add('shown'));
		if (reduced()) return;
		const to = targetRect(items[index]);
		const from = originMedia.getBoundingClientRect();
		busy = true;
		originMedia.style.visibility = 'hidden';
		frame
			.animate(
				[
					{ transform: flipFrom(from, to), borderRadius: '6px' },
					{ transform: 'none', borderRadius: '6px' },
				],
				{ duration: DURATION, easing: EASE },
			)
			.finished.finally(() => {
				originMedia.style.visibility = '';
				busy = false;
			});
	}

	async function close() {
		if (busy) return;
		busy = true;
		frame.querySelector('video')?.pause();
		dialog!.classList.remove('shown');
		const origin = reduced() ? null : originFor(index);
		if (origin) {
			const to = targetRect(items[index]);
			origin.style.visibility = 'hidden';
			await frame.animate([{ transform: 'none' }, { transform: flipFrom(origin.getBoundingClientRect(), to) }], {
				duration: DURATION - 60,
				easing: EASE,
				fill: 'forwards',
			}).finished;
			origin.style.visibility = '';
		} else if (!reduced()) {
			await frame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished;
		}
		frame.getAnimations().forEach((a) => a.cancel());
		frame.replaceChildren();
		dialog!.close();
		busy = false;
		opener?.focus({ preventScroll: true });
	}

	function go(step: number) {
		if (busy || items.length < 2) return;
		render(index + step);
		if (!reduced()) {
			frame.animate(
				[
					{ opacity: 0, transform: `translateX(${step * 24}px)` },
					{ opacity: 1, transform: 'none' },
				],
				{ duration: 260, easing: EASE },
			);
		}
	}

	document.addEventListener('click', (e) => {
		const t = (e.target as HTMLElement).closest<HTMLElement>('[data-lb-group]');
		if (!t || e.metaKey || e.ctrlKey || e.shiftKey) return;
		e.preventDefault();
		open(t.dataset.lbGroup!, Number(t.dataset.lbIndex || 0), t);
	});
	dialog.querySelector('.lb-close')!.addEventListener('click', close);
	dialog.querySelector('.lb-prev')!.addEventListener('click', () => go(-1));
	dialog.querySelector('.lb-next')!.addEventListener('click', () => go(1));
	dialog.addEventListener('cancel', (e) => {
		e.preventDefault();
		close();
	});
	dialog.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') go(1);
		else if (e.key === 'ArrowLeft') go(-1);
	});
	// Click on empty space closes.
	stage.addEventListener('click', (e) => {
		if (e.target === stage) close();
	});

	let sx = 0;
	let sy = 0;
	let touching = false;
	stage.addEventListener('pointerdown', (e) => {
		if (e.pointerType === 'mouse') return;
		touching = true;
		sx = e.clientX;
		sy = e.clientY;
	});
	stage.addEventListener('pointerup', (e) => {
		if (!touching) return;
		touching = false;
		const dx = e.clientX - sx;
		const dy = e.clientY - sy;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
		else if (dy > 90) close();
	});
	stage.addEventListener('pointercancel', () => (touching = false));

	window.addEventListener('resize', () => {
		if (dialog.open && items[index]) {
			const r = place(items[index]);
			frame.querySelector('img')?.setAttribute('sizes', `${r.width}px`);
		}
	});
}
