// Gallery cards: play the short loop while hovered (mouse/trackpad only).
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

for (const card of document.querySelectorAll<HTMLElement>('.card')) {
	const video = card.querySelector<HTMLVideoElement>('video[data-src]');
	if (!video) continue;
	card.addEventListener('mouseenter', () => {
		if (!finePointer.matches || reduced.matches) return;
		if (!video.src) video.src = video.dataset.src!;
		video.play().then(
			() => video.classList.add('on'),
			() => {},
		);
	});
	card.addEventListener('mouseleave', () => {
		video.pause();
		video.classList.remove('on');
	});
}
