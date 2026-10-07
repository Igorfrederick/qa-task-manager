import { useId } from 'react'

import styles from './TextField.module.css'

/**
 * Campo de formulário com rótulo e mensagem de erro. As demais props vão para
 * o `input` — entre elas o retorno do `register` do React Hook Form, `ref`
 * incluída, e o `data-cy`.
 */
export default function TextField({ label, error, errorDataCy, ...inputProps }) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className={styles.error} data-cy={errorDataCy}>
          {error}
        </p>
      )}
    </div>
  )
}
