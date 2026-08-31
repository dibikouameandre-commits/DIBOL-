import {
  n8nTriggerTypeLabels,
  type N8nWorkflowFormValues,
  type N8nTriggerType,
} from "@/lib/validations/tools";

// Type de nœud de déclenchement n8n réel selon le choix de l'utilisateur —
// fixé de façon déterministe (jamais choisi par l'IA elle-même), pour
// garantir un identifiant de nœud n8n exact et non halluciné.
const TRIGGER_NODE_TYPE: Record<N8nTriggerType, string> = {
  webhook: "n8n-nodes-base.webhook",
  schedule: "n8n-nodes-base.scheduleTrigger",
  manual: "n8n-nodes-base.manualTrigger",
};

// Construction du prompt IA de l'outil "workflow n8n" — fonction pure,
// aucun appel réseau ici (l'appel OpenAI réel est dans
// src/server/tools/n8n-workflow.ts).
//
// Contrainte spécifique à cet outil (contrairement aux 13 précédents) : la
// sortie doit être un JSON n8n structurellement valide, pas un texte libre.
// Le prompt restreint volontairement l'IA à un petit ensemble de types de
// nœuds n8n réels et courants, pour limiter le risque d'un identifiant de
// nœud halluciné ou d'une structure de "parameters" incohérente.
export function buildN8nWorkflowPrompt(
  values: N8nWorkflowFormValues
): { system: string; user: string } {
  const triggerLabel = n8nTriggerTypeLabels[values.triggerType];
  const triggerNodeType = TRIGGER_NODE_TYPE[values.triggerType];

  const system = `Tu es un expert n8n (outil d'automatisation de workflows) qui génère des workflows n8n simples et valides à partir d'un besoin décrit en langage naturel.
Règles strictes et non négociables :
- N'invente jamais un service, une API ou un identifiant de nœud n8n qui n'existe pas réellement.
- Utilise UNIQUEMENT ces types de nœuds n8n réels, selon le besoin : "n8n-nodes-base.manualTrigger", "n8n-nodes-base.webhook", "n8n-nodes-base.scheduleTrigger", "n8n-nodes-base.httpRequest", "n8n-nodes-base.set", "n8n-nodes-base.if", "n8n-nodes-base.noOp". N'utilise aucun autre type de nœud.
- Le workflow doit contenir entre 2 et 6 nœuds, en commençant TOUJOURS par un nœud déclencheur de type "${triggerNodeType}" (${triggerLabel}).
- Chaque nœud a un "id" unique (chaîne courte, ex: "1", "2"), un "name" unique et descriptif, le "type" exact ci-dessus, "typeVersion": 1, une "position" [x, y] avec x qui augmente de 250 environ à chaque nœud suivant (ex: [250, 300], [500, 300], [750, 300]), et des "parameters" cohérents avec le type de nœud et le besoin décrit (reste simple, ne mets que les paramètres essentiels).
- "connections" relie les nœuds dans l'ordre logique du workflow : chaque clé est le "name" exact d'un nœud source, sa valeur est un tableau de tableaux contenant { "node": "nom du nœud cible exact", "type": "main", "index": 0 }.
- "explanation" décrit en français, en 2-4 phrases claires, ce que fait le workflow généré, étape par étape.
- Réponds uniquement avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "workflow": {
    "name": string,
    "nodes": [ { "id": string, "name": string, "type": string, "typeVersion": 1, "position": [number, number], "parameters": object } ],
    "connections": { "<nom du nœud source>": [ [ { "node": string, "type": "main", "index": 0 } ] ] }
  },
  "explanation": string
}`;

  const user = `Déclencheur souhaité : ${triggerLabel}

Besoin d'automatisation décrit par l'utilisateur :
"""
${values.description}
"""`;

  return { system, user };
}
