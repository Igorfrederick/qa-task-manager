/**
 * Limites de tamanho dos textos da tarefa.
 *
 * Constante única pelo mesmo motivo dos enums: o schema Zod barra na rota, e
 * o model barra em qualquer outro caminho de escrita — o service chamado
 * direto, o seed. Um número escrito à mão nos dois divergiria em silêncio.
 */
export const TASK_TITLE_MAX_LENGTH = 120

export const TASK_DESCRIPTION_MAX_LENGTH = 2000
