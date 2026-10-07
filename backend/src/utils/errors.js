/**
 * Catálogo de `code`s da API e o erro que o usa.
 *
 * Fonte única dos `code`s no backend: cada um associado ao seu status HTTP e à
 * sua mensagem. O contrato é `api_contract.md` §Catálogo de `code`s; este
 * objeto o implementa. Decisão de 01/10/2026 em `docs/decisions.md`.
 *
 * O `code` carrega o status porque a relação é uma função: cada `code` tem
 * exatamente um status, e vários `code`s podem dividir o mesmo. Um mapa
 * `code → status` à parte seria uma segunda estrutura com as mesmas chaves,
 * livre para dessincronizar.
 *
 * `code` é contrato e não muda. `message` é apresentação, em português, e pode
 * mudar sem quebrar consumidor — os testes asserem o `code`.
 */
export const ERRORS = Object.freeze({
  VALIDATION_ERROR: { status: 400, message: 'Dados inválidos na requisição' },
  NOT_FOUND: { status: 404, message: 'Rota não encontrada' },
  // `409` porque é invariante de domínio: só se julga consultando o banco. O
  // formato do e-mail é invariante de entrada e morre no schema com `400`.
  EMAIL_TAKEN: { status: 409, message: 'Já existe usuário cadastrado com este e-mail' },
  INTERNAL_ERROR: { status: 500, message: 'Erro interno no servidor' },
})

/**
 * Erro lançado deliberadamente por uma camada da API — validação ou regra de
 * domínio.
 *
 * Construído pelo `code`: status e mensagem vêm do catálogo, e quem lança não
 * tem como divergir dele. O service não conhece `req` nem `res`; quando a
 * regra é violada, lança isto, e quem traduz para HTTP é o middleware de erro.
 */
export class AppError extends Error {
  /**
   * @param {keyof typeof ERRORS} code
   * @param {{ field: string, issue: string }[]} [details] falhas de validação
   */
  constructor(code, details = []) {
    // `code` fora do catálogo é erro de programação. Falha aqui, com o nome
    // errado na mensagem, em vez de responder com status e mensagem `undefined`.
    // `hasOwn`, e não `ERRORS[code]`: `'toString'` existe em todo objeto.
    if (!Object.hasOwn(ERRORS, code)) {
      throw new Error(`code fora do catálogo de erros: ${code}`)
    }

    super(ERRORS[code].message)
    this.name = 'AppError'
    this.code = code
    this.status = ERRORS[code].status
    this.details = details
  }
}
