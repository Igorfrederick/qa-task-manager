/**
 * Resposta fora do esperado numa chamada da service layer. Leva o status, para
 * quem chama distinguir a causa — credencial recusada não é API fora do ar —,
 * e o `code` do contrato quando o service o lê da resposta, como faz o
 * `TaskService`: tarefa inexistente se confere pelo `code`, não pela mensagem.
 */
export class ApiCallError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiCallError'
    this.status = status
    this.code = code
  }
}
