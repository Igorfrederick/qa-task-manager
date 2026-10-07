import mongoose from 'mongoose'

import {
  TASK_PRIORITY,
  TASK_PRIORITY_VALUES,
  TASK_STATUS,
  TASK_STATUS_VALUES,
} from '../utils/taskEnums.js'

/**
 * Tarefa de uma pessoa do time.
 *
 * `userId` é o dono: quem criou a tarefa (regra 3). Tem índice porque toda
 * consulta do `qa` filtra por ele.
 *
 * Na resposta, o dono aparece como `owner: { _id, name }`, e `userId` não
 * sai: o contrato expõe o dono uma vez só. `owner` é um virtual que o service
 * preenche com `populate` antes de devolver a tarefa.
 *
 * Os padrões de `description`, `status` e `priority` ficam aqui, e não no
 * schema de entrada: valem para qualquer caminho de criação — a rota, o
 * service chamado direto, o seed —, e não só para o que passa pelo Zod.
 */

function removeUserId(_doc, ret) {
  delete ret.userId
  return ret
}

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: TASK_STATUS_VALUES,
      default: TASK_STATUS.OPEN,
    },
    priority: {
      type: String,
      required: true,
      enum: TASK_PRIORITY_VALUES,
      default: TASK_PRIORITY.MEDIUM,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    // Sem o virtual `id`, que duplicaria `_id` na resposta.
    id: false,
    toJSON: { virtuals: true, transform: removeUserId },
  },
)

taskSchema.virtual('owner', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
})

export const Task = mongoose.model('Task', taskSchema)
