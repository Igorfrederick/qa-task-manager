import { useId } from 'react'

import styles from './FormField.module.css'

/**
 * Invólucro de um campo de formulário: rótulo, controle e mensagem de erro.
 * O controle chega como função, que recebe de volta o `id` do rótulo, os
 * atributos de acessibilidade do erro e a classe de estilo — cada campo
 * escolhe o elemento (`input`, `select`, `textarea`), e o resto é igual.
 */
export default function FormField({ label, error, errorDataCy, children }) {
  const id = useId()
  const errorId = `${id}-error`

  const controlProps = {
    id,
    className: styles.control,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(controlProps)}
      {error && (
        <p id={errorId} className={styles.error} data-cy={errorDataCy}>
          {error}
        </p>
      )}
    </div>
  )
}
