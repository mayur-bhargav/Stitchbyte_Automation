export interface PasswordRequirement {
  id: string;
  text: string;
  regex?: RegExp;
  validator?: (password: string) => boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  requirements: {
    [key: string]: boolean;
  };
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    text: 'At least 8 characters',
    validator: (password: string) => password.length >= 8
  },
  {
    id: 'uppercase',
    text: 'One uppercase letter (A-Z)',
    regex: /[A-Z]/
  },
  {
    id: 'lowercase',
    text: 'One lowercase letter (a-z)',
    regex: /[a-z]/
  },
  {
    id: 'number',
    text: 'One number (0-9)',
    regex: /\d/
  },
  {
    id: 'special',
    text: 'One special character (!@#$%^&*)',
    regex: /[!@#$%^&*(),.?":{}|<>]/
  }
];

export const validatePassword = (password: string, confirmPassword?: string): PasswordValidationResult => {
  const requirements: { [key: string]: boolean } = {};
  let metCount = 0;

  PASSWORD_REQUIREMENTS.forEach(req => {
    let isValid = false;
    
    if (req.validator) {
      isValid = req.validator(password);
    } else if (req.regex) {
      isValid = req.regex.test(password);
    }
    
    requirements[req.id] = isValid;
    if (isValid) metCount++;
  });

  // Check password match if confirmPassword is provided
  if (confirmPassword !== undefined) {
    requirements.match = password === confirmPassword && password !== '';
    if (requirements.match) metCount++;
  }

  const score = Math.round((metCount / Object.keys(requirements).length) * 100);
  const isValid = Object.values(requirements).every(Boolean);

  return {
    isValid,
    score,
    requirements
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score < 40) return 'red';
  if (score < 70) return 'yellow';
  return 'green';
};

export const getPasswordStrengthText = (score: number): string => {
  if (score < 40) return 'Weak';
  if (score < 70) return 'Medium';
  return 'Strong';
};
