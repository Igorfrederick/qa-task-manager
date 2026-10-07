import styles from './ErrorMessage.module.css'

/**
 * Mensagem de erro de uma chamada à API — o texto é o `message` do contrato.
 * As demais props, entre elas o `data-cy`, vão para o elemento.
 */
export default function ErrorMessage({ children, ...props }) {
  return (
    <p role="alert" className={styles.message} {...props}>
      {children}
    </p>
  )
}
