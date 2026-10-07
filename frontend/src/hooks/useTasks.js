import { useCallback, useEffect, useState } from 'react'

import * as taskService from '../services/taskService.js'

/**
 * Tarefas da listagem para os filtros dados, com carregamento e erro.
 * `reload` busca de novo com os mesmos filtros: depois de uma ação, a tarefa
 * alterada pode ter saído do filtro, e quem sabe a lista certa é a API.
 */
export function useTasks({ status, priority }) {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadCount, setReloadCount] = useState(0)

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
  }, [status, priority, reloadCount])

  // Marca o carregamento já na chamada, e não só quando o efeito rodar: entre
  // as duas renderizações, as ações da lista reabilitariam sobre dado velho.
  const reload = useCallback(() => {
    setIsLoading(true)
    setReloadCount((count) => count + 1)
  }, [])

  return { tasks, isLoading, error, reload }
}
