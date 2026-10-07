import { labelOf, PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../utils/taskOptions.js'
import styles from './TaskListPage.module.css'

/** Uma tarefa da lista. `showOwner` é o líder, que vê as tarefas do time. */
export default function TaskListItem({ task, showOwner }) {
  const id = task._id

  return (
    <li
      className={task.status === 'done' ? `${styles.item} ${styles.done}` : styles.item}
      data-cy={`task-list-row-${id}`}
    >
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
    </li>
  )
}
