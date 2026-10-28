// Turns data entries into what cards and the lightbox need.
import { categoryLabel, type CaseStudy, type Project3D } from './data';
import { lightboxItem, media, type LightboxItem, type Media } from './media';

export interface ProjectCard {
	kind: '3d';
	id: string;
	title: string;
	caption: string;
	kicker: string;
	cats: string[];
	cover: Media;
	count: number;
	fallbackHref: string;
}

export interface StudyCard {
	kind: 'eng';
	id: string;
	title: string;
	caption: string;
	kicker: string;
	cover: Media;
	href: string;
}

export async function projectCards(projects: Project3D[]) {
	const groups: Record<string, LightboxItem[]> = {};
	const cards: ProjectCard[] = [];
	for (const p of projects) {
		const all = p.media.map((ref) => {
			const m = media(ref, p.title);
			if (!m.caption) m.caption = `${p.title}. ${p.caption}`;
			return m;
		});
		groups[p.id] = await Promise.all(all.map(lightboxItem));
		cards.push({
			kind: '3d',
			id: p.id,
			title: p.title,
			caption: p.caption,
			kicker: categoryLabel(p.category),
			cats: [p.category, ...(p.alsoIn ?? [])],
			cover: all[0],
			count: all.length,
			fallbackHref: groups[p.id][0].src,
		});
	}
	return { cards, groups };
}

export function studyCard(s: CaseStudy): StudyCard {
	return {
		kind: 'eng',
		id: s.id,
		title: s.title,
		caption: s.summary,
		kicker: `Engineering · ${s.org}`,
		cover: media(s.cover, s.title),
		href: `/engineering/${s.id}`,
	};
}
