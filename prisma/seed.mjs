import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

const sql = neon(process.env.DATABASE_URL);

const categories = [
  {
    slug: "automatisation-n8n",
    name: "Automatisation n8n",
    description:
      "Workflows n8n prêts à l'emploi pour automatiser tes processus métier.",
  },
  {
    slug: "prompts-ia",
    name: "Prompts IA",
    description:
      "Bibliothèques de prompts testés pour ChatGPT et les principaux LLM.",
  },
  {
    slug: "formations-ia",
    name: "Formations IA",
    description:
      "Formations complètes pour maîtriser l'IA et l'automatisation.",
  },
  {
    slug: "templates-workflows",
    name: "Templates & Workflows",
    description: "Kits et templates prêts à personnaliser pour aller vite.",
  },
];

const products = [
  {
    slug: "pack-50-workflows-n8n",
    name: "Pack 50 Workflows n8n Prêts à l'Emploi",
    description:
      "50 workflows n8n testés et documentés pour automatiser la génération de leads, le support client, la publication de contenu et plus.",
    price: 39,
    category: "automatisation-n8n",
  },
  {
    slug: "automatisation-rh-n8n-ia",
    name: "Automatisation RH avec n8n et IA",
    description:
      "Analyse et évaluation automatique des CV depuis Gmail jusqu'à Google Sheets, propulsée par l'IA.",
    price: 29,
    category: "automatisation-n8n",
  },
  {
    slug: "generateur-contrats-automatise",
    name: "Générateur de Contrats Automatisé",
    description:
      "Workflow n8n qui génère et envoie des contrats personnalisés en quelques secondes.",
    price: 19,
    category: "automatisation-n8n",
  },
  {
    slug: "banque-500-prompts-chatgpt",
    name: "Banque de 500 Prompts ChatGPT",
    description:
      "500 prompts classés par usage : marketing, vente, productivité, création de contenu.",
    price: 15,
    category: "prompts-ia",
  },
  {
    slug: "prompts-icp-clients-ideaux",
    name: "Prompts ICP — Cibler ses Clients Idéaux",
    description:
      "Une suite de prompts pour définir précisément ton client idéal et affiner ton positionnement.",
    price: 12,
    category: "prompts-ia",
  },
  {
    slug: "top-100-prompts-contenu",
    name: "Top 100 Prompts pour Générer du Contenu",
    description:
      "Les meilleurs prompts pour produire des articles, posts et scripts vidéo en quelques minutes.",
    price: 9,
    category: "prompts-ia",
  },
  {
    slug: "formation-automatisation-ia",
    name: "Formation Complète Automatisation IA",
    description:
      "De zéro à expert : conçois tes propres agents et workflows IA pas à pas.",
    price: 99,
    category: "formations-ia",
  },
  {
    slug: "masterclass-ia-entrepreneurs",
    name: "Masterclass IA pour Entrepreneurs",
    description:
      "Comprends et exploite l'IA pour gagner du temps et scaler ton activité.",
    price: 79,
    category: "formations-ia",
  },
  {
    slug: "kit-generation-leads-ia",
    name: "Kit Génération de Leads par IA",
    description:
      "Templates et scripts prêts à l'emploi pour qualifier et convertir plus de prospects.",
    price: 25,
    category: "templates-workflows",
  },
  {
    slug: "templates-planification-journaliere-ia",
    name: "Templates Planification Journalière IA",
    description:
      "Organise tes journées et priorise tes tâches avec l'aide de l'IA.",
    price: 9,
    category: "templates-workflows",
  },
];

const categoryIds = {};

for (const c of categories) {
  const id = randomUUID();
  categoryIds[c.slug] = id;
  await sql`
    INSERT INTO "Category" (id, name, slug, description, "updatedAt")
    VALUES (${id}, ${c.name}, ${c.slug}, ${c.description}, now())
    ON CONFLICT (slug) DO NOTHING
  `;
}

for (const p of products) {
  const id = randomUUID();
  await sql`
    INSERT INTO "Product" (id, name, slug, description, price, "isPublished", "categoryId", "updatedAt")
    VALUES (${id}, ${p.name}, ${p.slug}, ${p.description}, ${p.price}, true, ${categoryIds[p.category]}, now())
    ON CONFLICT (slug) DO NOTHING
  `;
}

console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
