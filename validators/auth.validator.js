const validateRegistration = (userData) => {
  const errors = {};

  // Validate name
  if (!userData.name || userData.name.trim() === '') {
    errors.name = 'Please provide a name';
  } else if (userData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (userData.name.trim().length > 50) {
    errors.name = 'Name must not exceed 50 characters';
  }

  // Validate email
  if (!userData.email || userData.email.trim() === '') {
    errors.email = 'Please provide an email';
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(userData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Validate password
  if (!userData.password || userData.password.trim() === '') {
    errors.password = 'Please provide a password';
  } else if (userData.password.trim().length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateLogin = (loginData) => {
  const errors = {};

  // Validate email
  if (!loginData.email || loginData.email.trim() === '') {
    errors.email = 'Please provide an email';
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(loginData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Validate password
  if (!loginData.password || loginData.password.trim() === '') {
    errors.password = 'Please provide a password';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = { validateRegistration, validateLogin };