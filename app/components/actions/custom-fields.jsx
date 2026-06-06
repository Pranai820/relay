"use client";

import { Field, Input, Select, TextArea } from "./shared";

export function BoolSelect({ label, value, onChange }) {
  return (
    <Field label={label}>
      <Select
        value={value}
        onChange={onChange}
        options={[
          { value: "", label: "Default" },
          { value: "true", label: "True" },
          { value: "false", label: "False" },
        ]}
      />
    </Field>
  );
}

export function JsonArea({ label, value, onChange, rows = 6, placeholder, span = true }) {
  return (
    <Field label={label} span={span}>
      <TextArea value={value} onChange={onChange} rows={rows} placeholder={placeholder} />
    </Field>
  );
}

export function NumberInput({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
    </Field>
  );
}
