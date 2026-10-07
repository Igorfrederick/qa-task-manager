import { useSearchParams } from 'react-router'

import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import LoadingMessage from '../../components/LoadingMessage/LoadingMessage.jsx'
import SelectField from '../../components/SelectField/SelectField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useTasks } from '../../hooks/useTasks.js'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const status = readFilter(searchParams, 'status', STATUS_VALUES)
  const priority = readFilter(searchParams, 'priority', PRIORITY_VALUES)
  const { tasks, isLoading, error } = useTasks({ status, priority })

  function handleFilterChange(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(name, value)
    } else {
      next.delete(name)
    }
    setSearchParams(next, { replace: true })
  }

  function renderTasks() {
    if (error) {
      return <ErrorMessage data-cy="task-list-error-message">{error}</ErrorMessage>
    }
    if (isLoading) {
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
      <ul className={styles.list}>
        {tasks.map((task) => (
          <TaskListItem key={task._id} task={task} showOwner={user.role === 'lead'} />
        ))}
      </ul>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Tarefas</h1>
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

      {renderTasks()}
    </section>
  )
}
