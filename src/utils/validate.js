export const validateForm = (email, password) => {
  let errorMsg = ''
  //   const isNameValid = /^[a-zA-Z\\s]*$/.test(name);
  const isEmailValid = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/.test(
    email,
  )
  const isPasswordValid =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/.test(
      password,
    )

  if (!isPasswordValid && !isEmailValid) {
    errorMsg = 'Email & Password is not valid'
  } else if (!isEmailValid) {
    errorMsg = 'Email is not valid'
  } else if (!isPasswordValid) {
    errorMsg = 'Password is not valid'
  }

  return {
    success: isEmailValid && isPasswordValid,
    msg: errorMsg,
  }
}
