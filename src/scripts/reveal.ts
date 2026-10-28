// Fade/slide elements with class "reveal" in as they scroll into view.
const items = document.querySelectorAll<HTMLElement>('.reveal');
if ('IntersectionObserver' in window) {
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					e.target.classList.add('in');
					io.unobserve(e.target);
				}
			}
		},
		{ rootMargin: '0px 0px -8% 0px' },
	);
	items.forEach((el) => io.observe(el));
} else {
	items.forEach((el) => el.classList.add('in'));
}
