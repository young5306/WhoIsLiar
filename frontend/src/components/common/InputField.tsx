interface InputFieldProps {
  placeholder?: string;
  className?: string;
}

const InputField = ({ placeholder = '', className = '' }: InputFieldProps) => {
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
      />
    </div>
  );
};

export default InputField;
