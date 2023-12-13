export const validateForm = (name, email, password) => {
  let errors = {};
//   const isNameValid = /^[a-zA-Z\\s]*$/.test(name);
  const isEmailValid = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(
    email
  );
  const isPasswordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/.test(
      password
    );

  if (!isPasswordValid && !isEmailValid) {
    errors.general = "Email & Password is not valid";
  } else if (!isEmailValid) {
    errors.email = "Email is not valid";
    delete errors.general;
  } else if (!isPasswordValid) {
    errors.password = "Password is not valid";
    delete errors.general;
  } else {
    errors.null = null;
  }

  return errors;
};
