import { useState } from 'react';

import { UI_SIZES, ICON_SIZES, TEXTAREA_SIZES } from '../scale';
import { IconButton } from './Buttons';
import { TransparentBackdrop } from './Backdrops';

import { Eye, EyeOff, ChevronDown } from 'lucide-react';

// --- Shared Base Classes ---
const BASE_ICON_CLASS = 'shrink-0 text-muted transition-all duration-300 group-focus-within:text-accent';
const BASE_WRAPPER_CLASS = 'group flex w-full items-center gap-2 overflow-hidden rounded-md border border-border bg-surface text-main transition-all duration-300 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent';
const BASE_TEXTFIELD_CLASS = 'h-full w-full bg-transparent outline-none placeholder:text-muted';

// --- Components ---
export const InputField = ({ leftIcon: LeftIcon, rightIcon: RightIcon, size = 'medium', className = '', ...props }) => {
    return (
        <div className={`${BASE_WRAPPER_CLASS} ${UI_SIZES[size]} ${className}`}>
            {LeftIcon && <LeftIcon className={`${ICON_SIZES[size]} ${BASE_ICON_CLASS}`} />}

            <input type="text" className={BASE_TEXTFIELD_CLASS} {...props} />

            {RightIcon && <RightIcon className={`${ICON_SIZES[size]} ${BASE_ICON_CLASS}`} />}
        </div>
    );
};

export const PasswordField = ({ icon: Icon, size = 'medium', className = '', ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleToggle = () => setShowPassword((previous) => !previous);

    const eyeIcon = showPassword ? EyeOff : Eye;
    const inputType = showPassword ? 'text' : 'password';

    return (
        <div className={`${BASE_WRAPPER_CLASS} ${UI_SIZES[size]} ${className}`}>
            {Icon && <Icon className={`${ICON_SIZES[size]} ${BASE_ICON_CLASS}`} />}

            <input type={inputType} className={BASE_TEXTFIELD_CLASS} {...props} />

            <IconButton icon={eyeIcon} size="small" onClick={handleToggle} />
        </div>
    );
};

export const TextArea = ({ size = 'medium', className = '', ...props }) => {
    return (
        <div className={`${BASE_WRAPPER_CLASS} ${TEXTAREA_SIZES[size]} ${className}`}>
            <textarea className="w-full resize-y bg-transparent outline-none placeholder:text-muted" {...props} />
        </div>
    );
};

export const SelectField = ({ icon: DefaultIcon, options = [], value, size = 'medium', className = '', placeholder = 'Select...', onChange, ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((so) => so.value === value);
    const DisplayIcon = selectedOption?.icon || DefaultIcon;
    const displayText = selectedOption?.label || placeholder;

    const triggerStateClass = isOpen ? 'border-accent ring-1 ring-accent' : '';
    const iconStateClass = isOpen ? 'text-accent' : '';
    const textStateClass = selectedOption ? 'text-main' : 'text-muted';
    const chevronStateClass = isOpen ? 'rotate-180 text-accent' : '';

    const handleOpenSelect = () => setIsOpen((previous) => !previous);
    const handleCloseSelect = () => setIsOpen(false);
    const handleOptionSelect = (selectedValue) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative w-full ${className}`}>
            <button type="button" className={`${BASE_WRAPPER_CLASS} ${UI_SIZES[size]} ${triggerStateClass} cursor-pointer`} onClick={handleOpenSelect} {...props}>
                {DisplayIcon && <DisplayIcon className={`${ICON_SIZES[size]} ${BASE_ICON_CLASS} ${iconStateClass}`} />}

                <span className={`flex h-full w-full items-center truncate bg-transparent text-left outline-none ${textStateClass}`}>{displayText}</span>

                <ChevronDown className={`${ICON_SIZES[size]} ${BASE_ICON_CLASS} transition-all duration-300 ${chevronStateClass}`} />
            </button>

            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleCloseSelect} />

                    <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className="group/item flex w-full cursor-pointer items-center justify-start gap-2 px-4 py-3 text-sm font-medium text-main transition-all duration-300 hover:bg-surface-hover"
                                onClick={() => handleOptionSelect(option.value)}
                            >
                                {option.icon && <option.icon className={`${ICON_SIZES[size]} shrink-0 text-muted transition-all duration-300 group-hover/item:text-accent`} />}
                                {option.label && <span>{option.label}</span>}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
