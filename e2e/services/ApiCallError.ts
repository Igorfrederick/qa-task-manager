/**
 * Resposta fora do esperado numa chamada da service layer. Leva o status,
 * para quem chama distinguir a causa — credencial recusada não é API fora
 * do ar.
 */
export class ApiCallError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiCallError'
    this.status = status
  }
}
