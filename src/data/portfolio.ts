import type { Portfolio } from "../types/portfolio";

export const portfolio = {
	name: "Max Remy",
	company: "Max Remy Dev",
	role: "Software Engineer | Full-Stack Developer",
	location: "Moudon, Vaud, Switzerland",
	profile:
		"A Swiss Army knife developer with 10 years of freelance experience.\nEntirely self-taught, with no formal degree.",
	languages: ["French - Native (C2)", "English - Intermediate (B1+)", "German - Beginner (A1)"],
	links: [
		{
			label: "+41 79 873 06 05",
			href: "tel:+41798730605",
		},
		{
			label: "maxremy.dev@gmail.com",
			href: "mailto:maxremy.dev@gmail.com",
		},
		{
			label: "LinkedIn",
			href: "https://www.linkedin.com/in/maxremydev",
		},
		{
			label: "GitHub",
			href: "https://github.com/babyloopro",
		},
		{
			label: "Youtube",
			href: "https://www.youtube.com/@MaxRemyDev",
		},
		{
			label: "Twitter",
			href: "https://x.com/babyloopro",
		},
	],
	experiences: [
		{
			id: "muum-software-engineer",
			company: "MUUM",
			role: "Software Engineer",
			employmentType: "Freelance",
			location: "Remote, On-site",
			startDate: "2025-05",
			description:
				"Built a Swift/SwiftUI breathwork app for iOS and watchOS, integrating Apple Watch, Garmin, HealthKit, and real-time HR/HRV biofeedback.",
		},
		{
			id: "confidential-client-software-engineer",
			company: "Confidential Client",
			role: "Software Engineer",
			employmentType: "Freelance",
			location: "Full Remote",
			startDate: "2024-08",
			endDate: "2025-03",
			description:
				"Designed and built a distributed cryptocurrency arbitrage platform using C#, ASP.NET Core, MAUI, Docker, Grafana, and Prometheus.",
		},
		{
			id: "new-tells-studio-frontend-developer",
			company: "New Tells Studio",
			role: "Frontend Developer",
			employmentType: "Freelance",
			location: "Full Remote",
			startDate: "2024-08",
			endDate: "2024-12",
			description:
				"Built a responsive Next.js portfolio from Figma, with Rive animations for a motion design company.",
		},
		{
			id: "max-remy-dev-founder",
			company: "Max Remy Dev",
			role: "Founder",
			location: "Switzerland - Full Remote",
			startDate: "2023-03",
			description: "Operate individual company offering freelance services in IT.",
		},
		{
			id: "various-clients-freelance-developer",
			company: "Various Clients via Agency",
			role: "Freelance Developer",
			location: "Switzerland - Remote, On-site",
			startDate: "2017",
			endDate: "2023",
			description:
				"Delivered backend, automation, web, mobile, and game development solutions for various clients.",
		},
	],
	skillGroups: [
		{
			id: "programming-languages",
			label: "Languages",
			skills: ["C#", "Python", "Swift", "JavaScript", "TypeScript"],
		},
		{
			id: "backend",
			label: "Backend",
			skills: [".NET", "ASP.NET Core", "Django", "Node.js", "Express.js"],
		},
		{
			id: "frontend",
			label: "Frontend",
			skills: ["React.js", "Next.js", "HTML", "CSS", "Tailwind CSS"],
		},
		{
			id: "databases",
			label: "Databases",
			skills: ["MySQL", "NoSQL", "SQLite", "PostgreSQL"],
		},
		{
			id: "devops-cloud",
			label: "DevOps & Cloud",
			skills: ["Docker", "GitHub Actions", "AWS", "GCP", "Azure", "Kubernetes"],
		},
		{
			id: "practices",
			label: "Practices",
			skills: ["REST APIs", "CI/CD", "TDD", "BDD", "Agile/Scrum", "HERMES"],
		},
	],
} satisfies Portfolio;
