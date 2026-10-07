import { Task } from '../models/Task.js'
import { User } from '../models/User.js'
import { createTask } from '../services/taskService.js'
import { registerUser } from '../services/userService.js'
import { ROLES } from '../utils/roles.js'
import { TASK_PRIORITY, TASK_STATUS } from '../utils/taskEnums.js'

/**
 * Dado fictício para desenvolvimento e para o E2E: um `lead`, dois `qa` e
 * tarefas dos três.
 *
 * Recria a base a cada execução, e o estado depois do seed é sempre o mesmo.
 * As tarefas saem junto com os usuários: tarefa cujo dono não existe sairia na
 * resposta com `owner: null`.
 *
 * Usuários e tarefas nascem pelos services, os mesmos caminhos da API: hash da
 * senha, padrões e limites do model valem aqui como valem na rota.
 *
 * Não abre conexão nem conhece `process`: quem chama é `run.js`, e a suíte
 * chama direto, como faz com os services.
 *
 * Nenhum dado real: nomes inventados, e-mails no domínio reservado
 * `exemplo.test`, tarefas genéricas de um time de QA. As senhas vêm de quem
 * chama, nunca deste arquivo.
 */
const SEED = [
  {
    name: 'Helena Prado',
    email: 'lead@exemplo.test',
    role: ROLES.LEAD,
    tasks: [
      {
        title: 'Definir critérios de aceite da próxima release',
        priority: TASK_PRIORITY.HIGH,
      },
      {
        title: 'Revisar a cobertura de testes do time',
        status: TASK_STATUS.DONE,
      },
    ],
  },
  {
    name: 'Caio Mendes',
    email: 'qa@exemplo.test',
    role: ROLES.QA,
    tasks: [
      {
        title: 'Revisar plano de testes do checkout',
        description: 'Incluir os cenários de cupom expirado e de frete grátis',
        priority: TASK_PRIORITY.HIGH,
      },
      {
        title: 'Automatizar a regressão do login',
      },
      {
        title: 'Atualizar a massa de dados de homologação',
        status: TASK_STATUS.DONE,
        priority: TASK_PRIORITY.LOW,
      },
    ],
  },
  {
    name: 'Bruna Teles',
    email: 'qa2@exemplo.test',
    role: ROLES.QA,
    tasks: [
      {
        title: 'Explorar a tela de relatórios no celular',
        priority: TASK_PRIORITY.HIGH,
      },
      {
        title: 'Registrar as evidências do teste de carga',
        status: TASK_STATUS.DONE,
      },
      {
        title: 'Revisar os casos de teste de acessibilidade',
        priority: TASK_PRIORITY.LOW,
      },
    ],
  },
]

/**
 * Apaga usuários e tarefas e recria o conjunto fictício.
 *
 * Um a um, e não em paralelo: a listagem ordena por criação, e a ordem do
 * seed fica a mesma em toda execução.
 *
 * @param {{ leadPassword: string, qaPassword: string }} passwords senha do
 *        `lead` e senha comum aos dois `qa`
 * @returns {Promise<{ users: string[], tasks: number }>} e-mails criados e
 *          quantidade de tarefas, para o resumo de quem chamou
 */
export async function seedDatabase({ leadPassword, qaPassword }) {
  await Task.deleteMany({})
  await User.deleteMany({})

  let taskCount = 0
  for (const { tasks, ...data } of SEED) {
    const password = data.role === ROLES.LEAD ? leadPassword : qaPassword
    const user = await registerUser({ ...data, password })

    for (const task of tasks) {
      // O dono vem do usuário autenticado, como na rota (regra 3).
      await createTask({ id: user.id, role: user.role }, task)
      taskCount += 1
    }
  }

  return { users: SEED.map((user) => user.email), tasks: taskCount }
}
