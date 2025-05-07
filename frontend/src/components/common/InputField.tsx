interface InputFieldProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
}

const InputField = ({
  placeholder = '',
  value,
  onChange,
  onEnter,
}: InputFieldProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder={placeholder}
        maxLength={10}
        minLength={2}
        className="bg-gray-0/20 border-3 border-primary-600 w-[300px] h-[70px] rounded-lg px-4 
        headline-medium text-gray-0 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary-600/60"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default InputField;
