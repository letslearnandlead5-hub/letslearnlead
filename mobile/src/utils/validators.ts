export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const isValidPassword = (password: string): boolean => {
  return password.trim().length >= 6;
};

export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export interface RegisterFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const validateLoginForm = (
  email: string,
  password: string
): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!password.trim()) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
};

export const validateRegisterForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): RegisterFormErrors => {
  const errors: RegisterFormErrors = {};
  if (!isValidName(name)) errors.name = 'Name must be at least 2 characters';
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!isValidPassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (!confirmPassword.trim()) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
};
