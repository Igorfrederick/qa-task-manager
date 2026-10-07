import FormField from '../FormField/FormField.jsx'

/**
 * Campo de seleção. `options` é a lista de `{ value, label }`; as demais
 * props vão para o `select` — `value` e `onChange`, ou o retorno do
 * `register`, e o `data-cy`.
 */
export default function SelectField({ label, error, errorDataCy, options, ...selectProps }) {
  return (
    <FormField label={label} error={error} errorDataCy={errorDataCy}>
      {(controlProps) => (
        <select {...controlProps} {...selectProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )
}
