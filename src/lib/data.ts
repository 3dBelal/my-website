// Loads the YAML files in src/data/. Editing those files is all that is
// needed to change site content (see HOW-TO-UPDATE.md).
import { load } from 'js-yaml';
import siteRaw from '../data/site.yaml?raw';
import work3dRaw from '../data/work-3d.yaml?raw';
import engineeringRaw from '../data/engineering.yaml?raw';
import cvRaw from '../data/cv.yaml?raw';
import type { MediaRef } from './media';

export interface Site {
	name: string;
	title: string;
	description: string;
	email: string;
	location: string;
	cvPdf: string;
	ogImage: string;
	links: { label: string; url: string }[];
	hero: string[];
	about: string[];
	featured: string[];
}

export interface Project3D {
	id: string;
	title: string;
	category: string;
	alsoIn?: string[];
	caption: string;
	fanArt?: boolean;
	media: (MediaRef | string)[];
}

export interface Work3D {
	categories: { id: string; label: string }[];
	projects: Project3D[];
}

export interface CaseStudy {
	id: string;
	title: string;
	org: string;
	place?: string;
	period: string;
	role: string;
	summary: string;
	cover: string;
	tools: string[];
	problem: string;
	did: string[];
	result: string;
	sections: { heading: string; text?: string; media: (MediaRef | string)[] }[];
}

export interface CV {
	headline: string;
	phone: string;
	summary: string;
	education: { school: string; degree: string; field: string; place?: string; period: string }[];
	experience: { org: string; place: string; role: string; period: string; link?: string; points: string[] }[];
	projects: { title: string; period: string; link?: string; points: string[] }[];
	volunteer: { title: string; place?: string; period: string; points: string[] }[];
	skills: { group: string; items: string }[];
	languages: string;
}

export const site = load(siteRaw) as Site;
export const work3d = load(work3dRaw) as Work3D;
export const caseStudies = (load(engineeringRaw) as { studies: CaseStudy[] }).studies;
export const cv = load(cvRaw) as CV;

export const categoryLabel = (id: string) => work3d.categories.find((c) => c.id === id)?.label ?? id;
