import { useEffect, useState } from 'react'

import * as taskService from '../services/taskService.js'

/** Tarefas da listagem para os filtros dados, com carregamento e erro. */
export function useTasks({ status, priority }) {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Trocar de filtro antes da resposta chegar descarta a resposta antiga:
    // ela não pode sobrescrever a lista do filtro atual.
    let isCurrent = true
    setIsLoading(true)
    setError(null)

    taskService
      .listTasks({ status, priority })
      .then((tasks) => {
        if (isCurrent) setTasks(tasks)
      })
      .catch((error) => {
        if (isCurrent) setError(error.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [status, priority])

  return { tasks, isLoading, error }
}
