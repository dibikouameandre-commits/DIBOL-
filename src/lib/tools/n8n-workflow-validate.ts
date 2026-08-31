import type { N8nWorkflowJson } from "@/lib/validations/tools";

// Vérification d'intégrité supplémentaire, au-delà de ce que le schéma Zod
// peut exprimer : les clés de "connections" et les "node" référencés à
// l'intérieur doivent correspondre à des noms de nœuds qui existent
// réellement dans "nodes" — sinon le workflow ne s'importe pas dans n8n
// malgré une structure JSON par ailleurs valide. Fonction pure, aucun appel
// réseau, utilisée comme un second filtre après la validation du schéma
// (voir generateN8nWorkflow dans src/server/tools/n8n-workflow.ts).
export function validateN8nWorkflowIntegrity(workflow: N8nWorkflowJson): string[] {
  const issues: string[] = [];
  const nodeNames = new Set(workflow.nodes.map((n) => n.name));

  if (nodeNames.size !== workflow.nodes.length) {
    issues.push("Des nœuds ont le même nom — chaque nœud doit avoir un nom unique.");
  }

  for (const sourceName of Object.keys(workflow.connections)) {
    if (!nodeNames.has(sourceName)) {
      issues.push(`La connexion part d'un nœud inexistant : "${sourceName}".`);
    }
    const outputs = workflow.connections[sourceName];
    for (const output of outputs) {
      for (const ref of output) {
        if (!nodeNames.has(ref.node)) {
          issues.push(`La connexion pointe vers un nœud inexistant : "${ref.node}".`);
        }
      }
    }
  }

  return issues;
}
