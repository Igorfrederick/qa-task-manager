import { ZodError } from 'zod'

import { AppError } from '../utils/errors.js'

/**
 * Validação de entrada por schema Zod.
 *
 * Aplicado na definição da rota, antes do controller. O service pode assumir
 * que recebeu dado com a forma correta — é o que permite que ele trate só de
 * regra de negócio.
 *
 * Substitui a parte validada da requisição pelo resultado do parse, e não
 * apenas valida: o Zod normaliza (`trim`, `toLowerCase`) e remove campo não
 * declarado. Sem a substituição, o controller seguiria com a entrada crua e a
 * normalização seria trabalho jogado fora.
 */
export const validateBody = validateRequestPart('body')

/**
 * Um middleware por parte da requisição — corpo, query ou parâmetro de rota.
 * As três têm a mesma validação e o mesmo erro; o que muda é de onde a entrada
 * vem e para onde o resultado volta.
 */
function validateRequestPart(part) {
  return (schema) => (req, _res, next) => {
    try {
      req[part] = schema.parse(req[part])
      next()
    } catch (error) {
      next(error instanceof ZodError ? new AppError('VALIDATION_ERROR', toDetails(error)) : error)
    }
  }
}

/** Uma entrada de `details` por falha, no formato de `api_contract.md`. */
function toDetails(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    issue: issue.message,
  }))
}
