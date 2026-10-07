import Button from '../../components/Button/Button.jsx'
import { labelOf, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../utils/taskOptions.js'
import styles from './TaskListPage.module.css'

/**
 * Uma tarefa da lista, com as ações sobre ela. `showOwner` é o líder, que vê
 * as tarefas do time; `isBusy` trava as ações enquanto uma delas não volta.
 */
export default function TaskListItem({ task, showOwner, isBusy, onToggleStatus, onEdit, onDelete }) {
  const id = task._id
  const isDone = task.status === 'done'

  return (
    <li className={isDone ? `${styles.item} ${styles.done}` : styles.item} data-cy={`task-list-row-${id}`}>
      <div className={styles.content}>
        <h2 className={styles.title} data-cy={`task-list-title-${id}`}>
          {task.title}
        </h2>
        {task.description && <p className={styles.description}>{task.description}</p>}
        <div className={styles.meta}>
          <span className={`${styles.badge} ${styles[`status-${task.status}`]}`} data-cy={`task-list-status-${id}`}>
            {labelOf(STATUS_OPTIONS, task.status)}
          </span>
          <span
            className={`${styles.badge} ${styles[`priority-${task.priority}`]}`}
            data-cy={`task-list-priority-${id}`}
          >
            Prioridade {labelOf(PRIORITY_OPTIONS, task.priority).toLowerCase()}
          </span>
          {showOwner && (
            <span className={styles.owner}>
              Dono: <span data-cy={`task-list-owner-${id}`}>{task.owner?.name ?? 'usuário removido'}</span>
            </span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={isBusy}
          onClick={() => onToggleStatus(task)}
          aria-label={`${isDone ? 'Reabrir' : 'Concluir'} "${task.title}"`}
          data-cy={isDone ? `task-list-reopen-button-${id}` : `task-list-complete-button-${id}`}
        >
          {isDone ? 'Reabrir' : 'Concluir'}
        </Button>
        <Button
          variant="secondary"
          disabled={isBusy}
          onClick={() => onEdit(task)}
          aria-label={`Editar "${task.title}"`}
          data-cy={`task-list-edit-button-${id}`}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          disabled={isBusy}
          onClick={() => onDelete(task)}
          aria-label={`Excluir "${task.title}"`}
          data-cy={`task-list-delete-button-${id}`}
        >
          Excluir
        </Button>
      </div>
    </li>
  )
}
