import { useParams } from 'react-router'

import TaskForm from './TaskForm.jsx'

/**
 * Mesma tela para criar (`/tasks/new`) e editar (`/tasks/:id`). O React
 * Router reaproveita o componente entre as duas rotas; a `key` garante um
 * formulário novo por tarefa, sem herdar valores nem estado da anterior.
 */
export default function TaskFormPage() {
  const { id } = useParams()
  return <TaskForm key={id ?? 'new'} id={id} />
}
