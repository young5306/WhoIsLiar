interface InputFieldProps {
  placeholder?: string;
  className?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({
  placeholder = '',
  className = '',
  value,
  onChange,
}: InputFieldProps) => {
  return (
    <div
      className={`
        flex items-center px-4
        border-3 border-primary-600 
        rounded-lg
        bg-gray-0/20
        w-[300px] h-[60px]
        ${className}
      `}
    >
      <input
        type="text"
        placeholder={placeholder}
        className="headline-large text-primary-600 placeholder-primary-600 outline-none"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default InputField;
