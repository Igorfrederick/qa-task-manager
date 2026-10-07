import { faker } from '@faker-js/faker'

/** Id no formato do MongoDB que nenhuma tarefa tem: rota de tarefa sem depender de massa. */
export function buildTaskId(): string {
  return faker.database.mongodbObjectId()
}
