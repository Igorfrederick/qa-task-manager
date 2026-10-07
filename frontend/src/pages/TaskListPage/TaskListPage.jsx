import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import Button from '../../components/Button/Button.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import LoadingMessage from '../../components/LoadingMessage/LoadingMessage.jsx'
import SelectField from '../../components/SelectField/SelectField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useTasks } from '../../hooks/useTasks.js'
import * as taskService from '../../services/taskService.js'
import { PRIORITY_OPTIONS, PRIORITY_VALUES, STATUS_OPTIONS, STATUS_VALUES } from '../../utils/taskOptions.js'
import TaskListItem from './TaskListItem.jsx'
import styles from './TaskListPage.module.css'

// Os filtros vivem na URL: sobrevivem à recarga e à volta do formulário.
// Valor fora do domínio, digitado à mão, vale como "todos".
function readFilter(searchParams, name, values) {
  const value = searchParams.get(name)
  return values.includes(value) ? value : ''
}

export default function TaskListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = readFilter(searchParams, 'status', STATUS_VALUES)
  const priority = readFilter(searchParams, 'priority', PRIORITY_VALUES)
  const { tasks, isLoading, error, reload } = useTasks({ status, priority })
  const [busyTaskId, setBusyTaskId] = useState(null)
  const [actionError, setActionError] = useState(null)

  function handleFilterChange(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(name, value)
    } else {
      next.delete(name)
    }
    setSearchParams(next, { replace: true })
  }

  // Depois da ação, certa ou errada, a lista volta da API: a tarefa pode ter
  // saído do filtro, ou ter sido excluída por outra pessoa.
  async function runAction(taskId, action) {
    setBusyTaskId(taskId)
    setActionError(null)
    try {
      await action()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyTaskId(null)
      reload()
    }
  }

  // O formulário recebe os filtros atuais, para voltar à lista com eles.
  function openForm(path) {
    const query = searchParams.toString()
    navigate(path, { state: { listSearch: query ? `?${query}` : '' } })
  }

  function handleEdit(task) {
    openForm(`/tasks/${task._id}`)
  }

  function handleToggleStatus(task) {
    const status = task.status === 'done' ? 'open' : 'done'
    runAction(task._id, () => taskService.updateTask(task._id, { status }))
  }

  // Confirmação pelo diálogo nativo do navegador — decisão de 07/10/2026.
  function handleDelete(task) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return
    runAction(task._id, () => taskService.deleteTask(task._id))
  }

  function renderTasks() {
    if (error) {
      return <ErrorMessage data-cy="task-list-error-message">{error}</ErrorMessage>
    }
    // Ao recarregar, a lista anterior fica na tela, marcada como ocupada e com
    // as ações travadas: sumir com ela a cada ação faria a página pular, e agir
    // sobre ela antes da resposta seria agir sobre dado velho.
    if (isLoading && tasks.length === 0) {
      return <LoadingMessage>Carregando tarefas…</LoadingMessage>
    }
    if (tasks.length === 0) {
      return (
        <p className={styles.empty} data-cy="task-list-empty">
          Nenhuma tarefa encontrada.
        </p>
      )
    }
    return (
      <ul className={styles.list} aria-busy={isLoading}>
        {tasks.map((task) => (
          <TaskListItem
            key={task._id}
            task={task}
            showOwner={user.role === 'lead'}
            isBusy={isLoading || busyTaskId === task._id}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Tarefas</h1>
        <Button onClick={() => openForm('/tasks/new')} data-cy="task-list-new-button">
          Nova tarefa
        </Button>
      </div>

      <div className={styles.filters}>
        <SelectField
          label="Status"
          value={status}
          onChange={(event) => handleFilterChange('status', event.target.value)}
          options={[{ value: '', label: 'Todos' }, ...STATUS_OPTIONS]}
          data-cy="task-filter-status-select"
        />
        <SelectField
          label="Prioridade"
          value={priority}
          onChange={(event) => handleFilterChange('priority', event.target.value)}
          options={[{ value: '', label: 'Todas' }, ...PRIORITY_OPTIONS]}
          data-cy="task-filter-priority-select"
        />
      </div>

      {actionError && !error && (
        <ErrorMessage data-cy="task-list-error-message">{actionError}</ErrorMessage>
      )}
      {renderTasks()}
    </section>
  )
}
