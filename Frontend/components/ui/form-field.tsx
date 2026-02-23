import { Input, type InputProps } from "@/components/ui/input";

interface FormFieldProps extends InputProps {
  id: string;
  label: string;
  error?: string;
}

export function FormField({ id, label, error, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <Input id={id} {...props} className={error ? "border-rose-400" : ""} />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
