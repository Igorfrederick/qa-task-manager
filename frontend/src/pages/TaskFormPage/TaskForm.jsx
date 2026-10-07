import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import Button from '../../components/Button/Button.jsx'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage.jsx'
import FormField from '../../components/FormField/FormField.jsx'
import LoadingMessage from '../../components/LoadingMessage/LoadingMessage.jsx'
import SelectField from '../../components/SelectField/SelectField.jsx'
import TextField from '../../components/TextField/TextField.jsx'
import { TASK_FORM_FIELDS, taskSchema } from '../../schemas/taskSchema.js'
import * as taskService from '../../services/taskService.js'
import { PRIORITY_OPTIONS } from '../../utils/taskOptions.js'
import styles from './TaskFormPage.module.css'

// 404 é tarefa inexistente ou, para o qa, de outra pessoa (regra 2); 400 é id
// fora do formato. Para quem usa, os três são a mesma tarefa que não existe.
const NOT_FOUND_CODES = ['TASK_NOT_FOUND', 'VALIDATION_ERROR']

/** Formulário de tarefa: cria sem `id`, edita com ele. */
export default function TaskForm({ id }) {
  const isEditing = id !== undefined
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState(isEditing ? 'loading' : 'ready')
  const [apiError, setApiError] = useState(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', priority: 'medium' },
  })

  useEffect(() => {
    if (!isEditing) return
    let isCurrent = true

    taskService
      .getTask(id)
      .then((task) => {
        if (!isCurrent) return
        reset({ title: task.title, description: task.description, priority: task.priority })
        setLoadState('ready')
      })
      .catch((error) => {
        if (!isCurrent) return
        setApiError(error.message)
        setLoadState(NOT_FOUND_CODES.includes(error.code) ? 'not-found' : 'error')
      })

    return () => {
      isCurrent = false
    }
  }, [id, isEditing, reset])

  async function onSubmit(values) {
    setApiError(null)
    try {
      if (isEditing) {
        await taskService.updateTask(id, values)
      } else {
        await taskService.createTask(values)
      }
      navigate('/tasks')
    } catch (error) {
      // A API valida de novo: o campo que ela recusar mostra o erro nele.
      const fieldErrors = error.details?.filter(({ field }) => TASK_FORM_FIELDS.includes(field)) ?? []
      if (error.code === 'VALIDATION_ERROR' && fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, issue }) => setError(field, { message: issue }))
      } else if (error.code === 'TASK_NOT_FOUND') {
        setLoadState('not-found')
      } else {
        setApiError(error.message)
      }
    }
  }

  const backToList = () => navigate('/tasks')

  if (loadState === 'loading') {
    return <LoadingMessage>Carregando tarefa…</LoadingMessage>
  }

  if (loadState === 'not-found') {
    return (
      <section className={styles.notFound} data-cy="task-form-not-found">
        <h1>Tarefa não encontrada</h1>
        <p>Ela não existe ou foi excluída.</p>
        <Button variant="secondary" onClick={backToList} data-cy="task-form-back-button">
          Voltar para a lista
        </Button>
      </section>
    )
  }

  if (loadState === 'error') {
    return (
      <section className={styles.page}>
        <ErrorMessage data-cy="task-form-error-message">{apiError}</ErrorMessage>
        <div>
          <Button variant="secondary" onClick={backToList} data-cy="task-form-back-button">
            Voltar para a lista
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <h1>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</h1>

      {/* noValidate: quem valida é o schema, não o navegador */}
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {apiError && <ErrorMessage data-cy="task-form-error-message">{apiError}</ErrorMessage>}
        <TextField
          label="Título"
          error={errors.title?.message}
          errorDataCy="task-form-title-error"
          data-cy="task-form-title-input"
          {...register('title')}
        />
        <FormField
          label="Descrição (opcional)"
          error={errors.description?.message}
          errorDataCy="task-form-description-error"
        >
          {(controlProps) => (
            <textarea {...controlProps} rows={5} data-cy="task-form-description-input" {...register('description')} />
          )}
        </FormField>
        <SelectField
          label="Prioridade"
          options={PRIORITY_OPTIONS}
          error={errors.priority?.message}
          errorDataCy="task-form-priority-error"
          data-cy="task-form-priority-select"
          {...register('priority')}
        />
        <div className={styles.actions}>
          <Button type="submit" disabled={isSubmitting} data-cy="task-form-save-button">
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button variant="secondary" onClick={backToList} data-cy="task-form-cancel-button">
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  )
}
