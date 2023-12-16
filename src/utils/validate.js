export const validateForm = (email, password) => {
  let errors = {
    success: false,
    msg: "",
  };
  //   const isNameValid = /^[a-zA-Z\\s]*$/.test(name);
  const isEmailValid = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(
    email
  );
  const isPasswordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/.test(
      password
    );

  if (!isPasswordValid && !isEmailValid) {
    errors.msg = "Email & Password is not valid";
    errors.success = true;
  } else if (!isEmailValid) {
    errors.msg = "Email is not valid";
    errors.success = true;
  } else if (!isPasswordValid) {
    errors.msg = "Password is not valid";
    errors.success = true;
  }

  return errors;
};
