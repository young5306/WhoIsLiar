interface GameButtonProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'neon' | 'gray' | 'success' | 'primary';
  onClick?: () => void;
  disabled?: boolean;
}

const sizeClasses = {
  small: 'px-4 py-1 headline-large',
  medium: 'px-6 py-2 display-medium',
  large: 'px-8 py-3 display-large',
};

const variantClasses = {
  default: 'text-primary-600 border-primary-600',
  primary: 'text-primary-600 border-primary-600',
  neon: 'text-point-neon border-point-neon',
  gray: 'text-gray-500 border-gray-500',
  success: 'text-green-500 border-green-500',
};

const GameButton = ({
  text,
  size = 'medium',
  variant = 'default',
  onClick,
  disabled = false,
}: GameButtonProps) => {
  return (
    <div className="inline-block p-1 bg-gray-900 rounded-full ">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full 
          h-full 
          bg-point-button1 
          border-3 
          rounded-full 
          hover:brightness-140
          active:brightness-90
          transition
          text-nowrap
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${disabled ? 'opacity-50 cursor-default' : 'hover:brightness-140 active:brightness-90 cursor-pointer'}
          ${sizeClasses[size]}
        `}
      >
        {text}
      </button>
    </div>
  );
};

export default GameButton;
