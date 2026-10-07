import styles from './LoadingMessage.module.css'

/** Aviso de carregamento enquanto uma chamada à API não volta. */
export default function LoadingMessage({ children }) {
  return (
    <p role="status" className={styles.loading}>
      {children}
    </p>
  )
}
