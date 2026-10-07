import { faker } from '@faker-js/faker'

import type { TaskInput, TaskPriority } from '../services/TaskService'

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

/**
 * Tarefa nova, com todos os campos do formulário. Título e descrição carregam
 * entropia: as contas do seed são compartilhadas entre testes em paralelo, e
 * qualquer um dos dois pode ser a âncora do teste. Override fixa o que o teste
 * precisa — o status, uma prioridade conhecida, um título vazio.
 */
export function buildTask(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    title: `${faker.lorem.words({ min: 2, max: 4 })} ${faker.string.alphanumeric(8)}`,
    description: `${faker.lorem.sentence()} ${faker.string.alphanumeric(8)}`,
    priority: faker.helpers.arrayElement(PRIORITIES),
    ...overrides,
  }
}

/** Id no formato do MongoDB que nenhuma tarefa tem: rota de tarefa sem depender de massa. */
export function buildTaskId(): string {
  return faker.database.mongodbObjectId()
}
