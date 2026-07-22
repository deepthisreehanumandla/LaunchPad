interface FormErrorsProps {
  messages: string[];
}

export function FormErrors({ messages }: FormErrorsProps) {
  if (messages.length === 0) return null;

  if (messages.length === 1) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
        {messages[0]}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5">
      <ul className="list-disc space-y-1 pl-4 text-sm text-red-700">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
