import styles from './Button.module.css'

/**
 * Botão da aplicação. `type` padrão `button`: dentro de um formulário, só o
 * botão declarado `submit` envia.
 */
export default function Button({ variant = 'primary', type = 'button', ...buttonProps }) {
  return <button type={type} className={`${styles.button} ${styles[variant]}`} {...buttonProps} />
}
